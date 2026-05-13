package com.shopsphere.orderservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.orderservice.client.InventoryClient;
import com.shopsphere.orderservice.dto.request.OrderPlacedEvent;
import com.shopsphere.orderservice.dto.request.OrderRequest;
import com.shopsphere.orderservice.entity.Order;
import com.shopsphere.orderservice.entity.OrderLineItem;
import com.shopsphere.orderservice.repository.OrderRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    @CircuitBreaker(name = "inventoryService", fallbackMethod = "fallbackPlaceOrder")
    public String placeOrder(OrderRequest orderRequest, String userId) {

        // 1. We will only handle single-item orders for this simulation to keep the Saga simple
        OrderRequest.OrderLineItemDto itemDto = orderRequest.orderLineItems().getFirst();
        InventoryClient.InventoryRequest inventoryRequest = new InventoryClient.InventoryRequest(itemDto.skuCode(), itemDto.quantity());

        // 2. Synchronous Network Call: Attempt to Reserve Stock
        log.info("Calling Inventory Service to reserve {} units of {}", itemDto.quantity(), itemDto.skuCode());

        // This is the call protected by the Circuit Breaker
        Boolean isReserved = inventoryClient.reserveStock(inventoryRequest);

        if (Boolean.FALSE.equals(isReserved)) {
            throw new IllegalArgumentException("Product is out of stock, please try again later");
        }

        // 3. The stock is securely reserved. Now attempt to save the order locally.
        try {
            List<OrderLineItem> items = new ArrayList<>();
            items.add(OrderLineItem.builder()
                    .skuCode(itemDto.skuCode())
                    .price(itemDto.price())
                    .quantity(itemDto.quantity())
                    .build()
            );

            Order order = Order.builder()
                    .orderNumber(UUID.randomUUID().toString())
                    .userId(userId)
                    .orderLineItems(items)
                    .build();

            orderRepository.save(order);
            log.info("Order {} placed successfully", order.getOrderNumber());

            String message = String.format("Order Placed Successfully! Order Number: %s, User ID: %s", order.getOrderNumber(), userId);
            kafkaTemplate.send("notificationTopic", message);
            log.info("Notification event sent to Kafka topic");

            orderRepository.save(order);

            // creating the structured JSON event instead of a String
            OrderPlacedEvent event = new OrderPlacedEvent(order.getOrderNumber(), userId, itemDto.price());

            // Jackson ObjectMapper to convert the Record to a JSON String
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonMessage = objectMapper.writeValueAsString(event);

            // send to the specific topic Payment Service is listening to
            kafkaTemplate.send("order-events-topic", jsonMessage);

            log.info("OrderPlacedEvent dispatched to Kafka for Order Number: {}", order.getOrderNumber());

            return "Order Placed Successfully";

        } catch (Exception e) {
            // passing 'e' to the logger so it prints the full stack trace!
            log.error("Transaction failed. Triggering Saga Compensation. Root cause: {}", e.getMessage(), e);
            inventoryClient.releaseStock(inventoryRequest);
            throw new RuntimeException("Order creation failed, stock released.");
        }
    }

    public String fallbackPlaceOrder(OrderRequest orderRequest, String userId, Exception e) {
        log.error("Circuit Breaker triggered! Fallback active. Error: {}", e.getMessage());
        return "Oops! Our inventory system is currently busy or down. Your order cannot be placed right now. Please try again in a few moments.";
    }
}