package com.shopsphere.orderservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.orderservice.client.CartClient;
import com.shopsphere.orderservice.client.InventoryClient;
import com.shopsphere.orderservice.dto.event.OrderStateEvent;
import com.shopsphere.orderservice.dto.request.CartDto;
import com.shopsphere.orderservice.dto.request.CartItemDto;
import com.shopsphere.orderservice.dto.request.OrderPlacedEvent;
import com.shopsphere.orderservice.dto.request.OrderRequest;
import com.shopsphere.orderservice.dto.response.OrderResponse;
import com.shopsphere.orderservice.entity.Order;
import com.shopsphere.orderservice.entity.OrderLineItem;
import com.shopsphere.orderservice.enums.OrderStatus;
import com.shopsphere.orderservice.enums.PaymentMethod;
import com.shopsphere.orderservice.enums.PaymentStatus;
import com.shopsphere.orderservice.publisher.OrderEventPublisher;
import com.shopsphere.orderservice.repository.OrderRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final CartClient cartClient;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final OrderEventPublisher eventPublisher;

    @Transactional
    @CircuitBreaker(name = "inventoryService", fallbackMethod = "fallbackPlaceOrder")
    public String placeOrder(String userId, OrderRequest orderRequest) {

        log.info("Initiating checkout orchestration for user: {} with payment method: {}",
                userId, orderRequest.paymentMethod());

        // 1. GET THE SECURE CART (Source of Truth for Prices)
        CartDto cart = cartClient.getCart(userId);
        if (cart == null || cart.items() == null || cart.items().isEmpty()) {
            throw new IllegalArgumentException("Cannot place order: Cart is empty.");
        }

        List<OrderLineItem> orderLineItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        // 2. PROCESS ITEMS AND CALCULATE SECURE TOTAL
        for (CartItemDto cartItem : cart.items()) {
            orderLineItems.add(OrderLineItem.builder()
                    .skuCode(cartItem.skuCode())
                    .price(cartItem.snapshotPrice())
                    .quantity(cartItem.quantity())
                    .build());

            BigDecimal itemTotal = cartItem.snapshotPrice().multiply(BigDecimal.valueOf(cartItem.quantity()));
            totalAmount = totalAmount.add(itemTotal);
        }

        // 3. HARD INVENTORY CHECK (Synchronous Network Call)
        for (OrderLineItem item : orderLineItems) {
            InventoryClient.InventoryRequest inventoryRequest = new InventoryClient.InventoryRequest(
                    item.getSkuCode(), item.getQuantity());
            log.info("Calling Inventory Service to reserve {} units of {}", item.getQuantity(), item.getSkuCode());

            Boolean isReserved = inventoryClient.reserveStock(inventoryRequest);

            if (Boolean.FALSE.equals(isReserved)) {
                log.error("Insufficient stock for SKU: {}", item.getSkuCode());
                throw new IllegalArgumentException("Insufficient stock for item: " + item.getSkuCode());
            }
        }

        // 4. THE TRANSACTION BLOCK
        try {
            Order order = Order.builder()
                    .orderNumber(UUID.randomUUID().toString())
                    .userId(userId)
                    .orderLineItems(orderLineItems)
                    .paymentMethod(orderRequest.paymentMethod()) // Set the requested payment method
                    .build();

            // --- THE ROUTING LOGIC ---
            order.setPaymentStatus(PaymentStatus.PENDING); // All new orders start with PENDING money

            if (order.getPaymentMethod() == PaymentMethod.COD) {
                log.info("COD order detected. Fast-tracking to PROCESSING state.");
                order.setOrderStatus(OrderStatus.PROCESSING);
            } else {
                log.info("Digital payment detected. Setting to PLACED state. Waiting for payment confirmation.");
                order.setOrderStatus(OrderStatus.PLACED);
            }

            orderRepository.save(order);
            log.info("Order {} placed successfully", order.getOrderNumber());

            // Notification Event
            String message = String.format("Order Placed Successfully! Order Number: %s, User ID: %s", order.getOrderNumber(), userId);
            kafkaTemplate.send("notificationTopic", message);

            // Payment Event
            OrderPlacedEvent event = new OrderPlacedEvent(order.getOrderNumber(), userId, totalAmount);
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonMessage = objectMapper.writeValueAsString(event);

            kafkaTemplate.send("order-events-topic", jsonMessage);
            log.info("OrderPlacedEvent dispatched to Kafka for Order Number: {}", order.getOrderNumber());

            // 5. CLEAR THE CART
            cartClient.clearCart(userId);
            log.info("Cart cleared for user: {}", userId);

            return "Order Placed Successfully. Order ID: " + order.getOrderNumber();

        } catch (Exception e) {
            log.error("Transaction failed during finalization. Root cause: {}", e.getMessage(), e);

            // SAGA COMPENSATION: Release the stock we just reserved!
            for (OrderLineItem item : orderLineItems) {
                inventoryClient.releaseStock(new InventoryClient.InventoryRequest(item.getSkuCode(), item.getQuantity()));
            }
            throw new RuntimeException("Checkout failed, inventory released.");
        }
    }

    @Transactional
    public void confirmOrderPayment(String orderId) {
        Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Only PENDING payments can be confirmed");
        }

        order.setPaymentStatus(PaymentStatus.COMPLETED);
        order.setOrderStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);

        Map<String, Integer> skuMap = order.getOrderLineItems().stream()
                .collect(Collectors.toMap(
                        OrderLineItem::getSkuCode,
                        OrderLineItem::getQuantity
                ));

        eventPublisher.publishOrderPaidEvent(new OrderStateEvent(order.getOrderNumber(), skuMap));
    }

    @Transactional
    public void cancelOrder(String orderId) {
        Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getOrderStatus() == OrderStatus.SHIPPED || order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel an order that has already shipped");
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);
        orderRepository.save(order);

        Map<String, Integer> skuMap = order.getOrderLineItems().stream()
                .collect(Collectors.toMap(
                        OrderLineItem::getSkuCode,
                        OrderLineItem::getQuantity
                ));

        eventPublisher.publishOrderCancelledEvent(new OrderStateEvent(order.getOrderNumber(), skuMap));
    }

    // fallback method for Circuit Breaker
    public String fallbackPlaceOrder(String userId, OrderRequest orderRequest, Exception e) {
        log.error("Circuit Breaker triggered! Fallback active. Error: {}", e.getMessage());
        return "Oops! Our checkout system is currently busy or down. Your order cannot be placed right now. Please try again in a few moments.";
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrdersForUser(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapOrderToOrderResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapOrderToOrderResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));
        return mapOrderToOrderResponse(order);
    }

    public OrderResponse mapOrderToOrderResponse(Order order) {
        BigDecimal calculatedTotal = order.getOrderLineItems().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .orderLineItems(order.getOrderLineItems())
                .createdAt(order.getCreatedAt())
                .totalPrice(calculatedTotal)
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .build();
    }
}