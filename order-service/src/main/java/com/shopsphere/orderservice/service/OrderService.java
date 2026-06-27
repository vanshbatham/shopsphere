package com.shopsphere.orderservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.orderservice.client.*;
import com.shopsphere.orderservice.dto.event.OrderStateEvent;
import com.shopsphere.orderservice.dto.request.*;
import com.shopsphere.orderservice.dto.response.CouponResponse;
import com.shopsphere.orderservice.dto.response.OrderResponse;
import com.shopsphere.orderservice.dto.response.SkuSummaryResponse;
import com.shopsphere.orderservice.entity.Order;
import com.shopsphere.orderservice.entity.OrderLineItem;
import com.shopsphere.orderservice.entity.ShippingAddress;
import com.shopsphere.orderservice.enums.OrderStatus;
import com.shopsphere.orderservice.enums.PaymentMethod;
import com.shopsphere.orderservice.enums.PaymentStatus;
import com.shopsphere.orderservice.exception.BadRequestException;
import com.shopsphere.orderservice.exception.ResourceNotFoundException;
import com.shopsphere.orderservice.publisher.OrderEventPublisher;
import com.shopsphere.orderservice.repository.OrderRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
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
    private final UserClient userClient;
    private final CouponClient couponClient;
    private final ProductClient productClient;

    @Transactional
    @CircuitBreaker(name = "inventoryService", fallbackMethod = "fallbackPlaceOrder")
    public String placeOrder(String userId, OrderRequest orderRequest) {

        log.info("Initiating checkout orchestration for user: {} with payment method: {}",
                userId, orderRequest.paymentMethod());

        // 1. GET THE SECURE CART (Source of Truth for Prices)
        CartDto cart = cartClient.getCart(userId);
        if (cart == null || cart.items() == null || cart.items().isEmpty()) {
            throw new BadRequestException("Cannot place order: Cart is empty.");
        }

        List<OrderLineItem> orderLineItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        // 2. PROCESS ITEMS AND CALCULATE SECURE SUBTOTAL
        for (CartItemDto cartItem : cart.items()) {
            orderLineItems.add(OrderLineItem.builder()
                    .skuCode(cartItem.skuCode())
                    .price(cartItem.snapshotPrice())
                    .quantity(cartItem.quantity())
                    .build());

            BigDecimal itemTotal = cartItem.snapshotPrice().multiply(BigDecimal.valueOf(cartItem.quantity()));
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal finalTotalAmount = subtotal;

        // 3. CONSUME COUPON & APPLY FINANCIAL MATH
        if (orderRequest.couponCode() != null && !orderRequest.couponCode().isBlank()) {
            log.info("Order contains coupon code: {}. Attempting to consume...", orderRequest.couponCode());
            try {
                CouponResponse coupon = couponClient.consumeCoupon(orderRequest.couponCode());
                log.info("Coupon consumed. Type: {}, Value: {}", coupon.discountType(), coupon.discountValue());

                BigDecimal discountAmount = BigDecimal.ZERO;

                if ("PERCENTAGE".equals(coupon.discountType().name())) {
                    BigDecimal percentageMultiplier = coupon.discountValue().divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                    discountAmount = subtotal.multiply(percentageMultiplier);
                } else if ("FLAT_AMOUNT".equals(coupon.discountType().name())) {
                    discountAmount = coupon.discountValue();
                }

                finalTotalAmount = subtotal.subtract(discountAmount);

                if (finalTotalAmount.compareTo(BigDecimal.ZERO) < 0) {
                    finalTotalAmount = BigDecimal.ZERO;
                }
                log.info("Discount applied: -{}. New Total: {}", discountAmount, finalTotalAmount);

            } catch (feign.FeignException e) {
                log.error("Failed to apply coupon. Feign Status: {}", e.status());
                throw new BadRequestException("Invalid, expired, or maxed-out coupon code applied.");
            }
        }

        // 4. APPLY THE ONLY TWO FEES THIS APP CHARGES: a flat ₹9 platform fee
        // for Cash on Delivery orders, and a ₹49 delivery fee on orders under
        // ₹500 (free at/above that threshold). Must mirror Checkout.jsx and
        // Cart.jsx exactly, or the amount charged via Razorpay and the amount
        // stored as the order's totalAmount will disagree.
        BigDecimal platformFee = "COD".equals(orderRequest.paymentMethod())
                ? new BigDecimal("9")
                : BigDecimal.ZERO;
        BigDecimal deliveryFee = finalTotalAmount.compareTo(new BigDecimal("500")) < 0
                ? new BigDecimal("49")
                : BigDecimal.ZERO;
        finalTotalAmount = finalTotalAmount.add(platformFee).add(deliveryFee);

        // 5. FETCH ADDRESS SNAPSHOT
        AddressDto addressDto;
        try {
            log.info("Fetching address snapshot for Address ID: {}", orderRequest.addressId());
            addressDto = userClient.getAddressById(userId, orderRequest.addressId());
        } catch (Exception e) {
            log.error("Failed to retrieve address from User Service", e);
            throw new BadRequestException("Invalid Address Selected.");
        }

        ShippingAddress snapshotAddress = ShippingAddress.builder()
                .street(addressDto.street())
                .city(addressDto.city())
                .state(addressDto.state())
                .zipCode(addressDto.zipCode())
                .country(addressDto.country())
                .build();

        // 6. HARD INVENTORY CHECK
        for (OrderLineItem item : orderLineItems) {
            InventoryClient.InventoryRequest inventoryRequest = new InventoryClient.InventoryRequest(
                    item.getSkuCode(), item.getQuantity());
            log.info("Calling Inventory Service to reserve {} units of {}", item.getQuantity(), item.getSkuCode());

            Boolean isReserved = inventoryClient.reserveStock(inventoryRequest);

            if (Boolean.FALSE.equals(isReserved)) {
                log.error("Insufficient stock for SKU: {}", item.getSkuCode());
                throw new BadRequestException("Insufficient stock for item: " + item.getSkuCode());
            }
        }

        // 7. THE TRANSACTION BLOCK
        try {
            Order order = Order.builder()
                    .orderNumber(UUID.randomUUID().toString()) // displaying-only label, not used as identifier
                    .userId(userId)
                    .orderLineItems(orderLineItems)
                    .paymentMethod(PaymentMethod.valueOf(orderRequest.paymentMethod()))
                    .shippingAddress(snapshotAddress)
                    .totalAmount(finalTotalAmount)
                    .build();

            order.setPaymentStatus(PaymentStatus.PENDING);

            if (order.getPaymentMethod() == PaymentMethod.COD) {
                log.info("COD order detected. Fast-tracking to PROCESSING state.");
                order.setOrderStatus(OrderStatus.PROCESSING);
            } else {
                log.info("Digital payment detected. Setting to PLACED state. Waiting for payment confirmation.");
                order.setOrderStatus(OrderStatus.PLACED);
            }

            orderRepository.save(order);

            String canonicalOrderId = order.getId().toString();
            log.info("Order {} placed successfully. Final Total: {}", canonicalOrderId, finalTotalAmount);

            String message = String.format("Order Placed Successfully! Order ID: %s, User ID: %s",
                    canonicalOrderId, userId);
            kafkaTemplate.send("notificationTopic", message);

            OrderPlacedEvent event = new OrderPlacedEvent(canonicalOrderId, userId, finalTotalAmount);
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonMessage = objectMapper.writeValueAsString(event);

            kafkaTemplate.send("order-events-topic", jsonMessage);
            log.info("OrderPlacedEvent dispatched to Kafka for Order ID: {}", canonicalOrderId);

            // 8. CLEAR THE CART
            cartClient.clearCart(userId);
            log.info("Cart cleared for user: {}", userId);

            return canonicalOrderId;

        } catch (Exception e) {
            log.error("Transaction failed during finalization. Root cause: {}", e.getMessage(), e);

            for (OrderLineItem item : orderLineItems) {
                inventoryClient.releaseStock(new InventoryClient.InventoryRequest(item.getSkuCode(), item.getQuantity()));
            }
            throw new RuntimeException("Checkout failed, inventory released.");
        }
    }

    @Transactional
    public void confirmOrderPayment(String orderId) {
        Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getPaymentStatus() == PaymentStatus.COMPLETED) {
            log.info("Order {} payment already confirmed. Ignoring duplicate event.", orderId);
            return;
        }

        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException("Only PENDING payments can be confirmed");
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
    public void handleFailedPayment(String orderId) {
        Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getOrderStatus() == OrderStatus.CANCELLED
                || order.getPaymentStatus() == PaymentStatus.COMPLETED) {
            log.info("Order {} already in terminal state ({}, {}). Ignoring duplicate failed-payment event.",
                    orderId, order.getOrderStatus(), order.getPaymentStatus());
            return;
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
        log.warn("Order {} payment failed. Order cancelled and inventory released.", orderId);
    }

    @Transactional
    public void cancelOrder(String orderId) {
        Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getOrderStatus() == OrderStatus.SHIPPED || order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot cancel an order that has already shipped");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            log.info("Order {} is already cancelled. Ignoring duplicate cancel request.", orderId);
            return;
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
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        return mapOrderToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public boolean checkPurchaseHistory(String userId, String skuCode) {
        log.info("Verifying strict purchase history for User: {} and SKU: {}", userId, skuCode);
        boolean isVerified = orderRepository.existsVerifiedPurchase(userId, skuCode);

        if (isVerified) {
            log.info("Verification successful. User {} is a verified buyer of {}", userId, skuCode);
        } else {
            log.warn("Verification failed. User {} does not have a COMPLETED/DELIVERED order for {}", userId, skuCode);
        }

        return isVerified;
    }

    @Transactional
    @CircuitBreaker(name = "inventoryService", fallbackMethod = "fallbackDirectOrder")
    public String placeDirectOrder(String userId, DirectOrderRequest request) {

        log.info("Initiating DIRECT checkout for user: {} for SKU: {}", userId, request.skuCode());

        // 1. FETCH SECURE PRICE FROM PRODUCT SERVICE
        BigDecimal itemPrice;
        try {
            itemPrice = productClient.getProductPrice(request.skuCode());
        } catch (Exception e) {
            log.error("Failed to fetch price for SKU: {}", request.skuCode(), e);
            throw new BadRequestException("Invalid Product SKU.");
        }

        BigDecimal subtotal = itemPrice.multiply(BigDecimal.valueOf(request.quantity()));
        BigDecimal finalTotalAmount = subtotal;

        // 2. CONSUME COUPON
        if (request.couponCode() != null && !request.couponCode().isBlank()) {
            try {
                CouponResponse coupon = couponClient.consumeCoupon(request.couponCode());
                BigDecimal discountAmount = BigDecimal.ZERO;

                if ("PERCENTAGE".equals(coupon.discountType().name())) {
                    BigDecimal percentageMultiplier = coupon.discountValue().divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                    discountAmount = subtotal.multiply(percentageMultiplier);
                } else if ("FLAT_AMOUNT".equals(coupon.discountType().name())) {
                    discountAmount = coupon.discountValue();
                }

                finalTotalAmount = subtotal.subtract(discountAmount);
                if (finalTotalAmount.compareTo(BigDecimal.ZERO) < 0) {
                    finalTotalAmount = BigDecimal.ZERO;
                }
            } catch (feign.FeignException e) {
                throw new BadRequestException("Invalid or expired coupon code.");
            }
        }

        // 3. APPLY THE SAME TWO FEES AS THE CART CHECKOUT FLOW (see placeOrder
        // above for details) — COD platform fee + under-₹500 delivery fee.
        BigDecimal platformFee = "COD".equals(request.paymentMethod())
                ? new BigDecimal("9")
                : BigDecimal.ZERO;
        BigDecimal deliveryFee = finalTotalAmount.compareTo(new BigDecimal("500")) < 0
                ? new BigDecimal("49")
                : BigDecimal.ZERO;
        finalTotalAmount = finalTotalAmount.add(platformFee).add(deliveryFee);

        // 4. FETCH ADDRESS SNAPSHOT
        AddressDto addressDto = userClient.getAddressById(userId, UUID.fromString(request.addressId()));
        ShippingAddress snapshotAddress = ShippingAddress.builder()
                .street(addressDto.street())
                .city(addressDto.city())
                .state(addressDto.state())
                .zipCode(addressDto.zipCode())
                .country(addressDto.country())
                .build();

        // 5. HARD INVENTORY CHECK
        InventoryClient.InventoryRequest invReq = new InventoryClient.InventoryRequest(request.skuCode(), request.quantity());
        if (Boolean.FALSE.equals(inventoryClient.reserveStock(invReq))) {
            throw new BadRequestException("Insufficient stock for item: " + request.skuCode());
        }

        // 6. THE TRANSACTION BLOCK
        try {
            OrderLineItem singleItem = OrderLineItem.builder()
                    .skuCode(request.skuCode())
                    .price(itemPrice)
                    .quantity(request.quantity())
                    .build();

            Order order = Order.builder()
                    .orderNumber(UUID.randomUUID().toString()) // display-only label
                    .userId(userId)
                    .orderLineItems(List.of(singleItem))
                    .paymentMethod(PaymentMethod.valueOf(request.paymentMethod()))
                    .shippingAddress(snapshotAddress)
                    .totalAmount(finalTotalAmount)
                    .build();

            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setOrderStatus(request.paymentMethod().equals("COD") ? OrderStatus.PROCESSING : OrderStatus.PLACED);

            orderRepository.save(order);

            String canonicalOrderId = order.getId().toString();
            log.info("Direct Order {} placed successfully. Final Total: {}", canonicalOrderId, finalTotalAmount);

            kafkaTemplate.send("notificationTopic",
                    "Order Placed Successfully! Order ID: " + canonicalOrderId);

            OrderPlacedEvent event = new OrderPlacedEvent(canonicalOrderId, userId, finalTotalAmount);
            ObjectMapper objectMapper = new ObjectMapper();
            kafkaTemplate.send("order-events-topic", objectMapper.writeValueAsString(event));
            log.info("OrderPlacedEvent dispatched to Kafka for Order ID: {}", canonicalOrderId);

            return canonicalOrderId;

        } catch (Exception e) {
            inventoryClient.releaseStock(new InventoryClient.InventoryRequest(request.skuCode(), request.quantity()));
            throw new RuntimeException("Direct Checkout failed, inventory released.");
        }
    }

    public String fallbackDirectOrder(String userId, DirectOrderRequest request, Exception e) {
        return "Oops! Our checkout system is currently busy. Your direct order cannot be placed right now.";
    }

    public OrderResponse mapOrderToOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .orderLineItems(order.getOrderLineItems())
                .createdAt(order.getCreatedAt())
                .totalPrice(order.getTotalAmount())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .shippingAddress(order.getShippingAddress())
                .build();
    }

    @Transactional(readOnly = true)
    public List<SkuSummaryResponse> getSellerSummary(List<String> skuCodes) {
        Set<String> skuSet = new HashSet<>(skuCodes);
        Map<String, Integer> qtyBySku = new HashMap<>();
        Map<String, BigDecimal> revenueBySku = new HashMap<>();

        List<Order> allOrders = orderRepository.findAll();
        for (Order order : allOrders) {
            if (order.getPaymentStatus() != PaymentStatus.COMPLETED) continue;
            if (order.getOrderLineItems() == null) continue;

            for (OrderLineItem item : order.getOrderLineItems()) {
                if (!skuSet.contains(item.getSkuCode())) continue;

                qtyBySku.merge(item.getSkuCode(), item.getQuantity(), Integer::sum);
                BigDecimal lineRevenue = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                revenueBySku.merge(item.getSkuCode(), lineRevenue, BigDecimal::add);
            }
        }

        return skuCodes.stream()
                .map(sku -> new SkuSummaryResponse(
                        sku,
                        qtyBySku.getOrDefault(sku, 0),
                        revenueBySku.getOrDefault(sku, BigDecimal.ZERO)
                ))
                .toList();
    }
}