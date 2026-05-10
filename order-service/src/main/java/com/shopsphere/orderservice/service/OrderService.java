package com.shopsphere.orderservice.service;

import com.shopsphere.orderservice.client.InventoryClient;

import com.shopsphere.orderservice.dto.request.OrderRequest;
import com.shopsphere.orderservice.entity.Order;
import com.shopsphere.orderservice.entity.OrderLineItem;
import com.shopsphere.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;

    @Transactional
    public String placeOrder(OrderRequest orderRequest, String userId) {

        // 1. We will only handle single-item orders for this simulation to keep the Saga simple
        OrderRequest.OrderLineItemDto itemDto = orderRequest.orderLineItems().getFirst();
        InventoryClient.InventoryRequest inventoryRequest = new InventoryClient.InventoryRequest(itemDto.skuCode(), itemDto.quantity());

        // 2. Synchronous Network Call: Attempt to Reserve Stock
        log.info("Calling Inventory Service to reserve {} units of {}", itemDto.quantity(), itemDto.skuCode());
        Boolean isReserved = inventoryClient.reserveStock(inventoryRequest);

        if (Boolean.FALSE.equals(isReserved)) {
            throw new IllegalArgumentException("Product is out of stock, please try again later");
        }

        // 3. The stock is securely reserved. Now attempt to save the order locally.
        try {
            Order order = Order.builder()
                    .orderNumber(UUID.randomUUID().toString())
                    .userId(userId)
                    .orderLineItems(List.of(
                            OrderLineItem.builder()
                                    .skuCode(itemDto.skuCode())
                                    .price(itemDto.price())
                                    .quantity(itemDto.quantity())
                                    .build()
                    ))
                    .build();

            orderRepository.save(order);
            log.info("Order {} placed successfully", order.getOrderNumber());

            // In a full system, we would drop a message to Kafka here to trigger the Payment Service

            return "Order Placed Successfully";

        } catch (Exception e) {
            // SAGA COMPENSATION: If the database crashes or saving fails, release the locked inventory
            log.error("Failed to save order locally. Triggering Saga Compensation: Releasing Inventory");
            inventoryClient.releaseStock(inventoryRequest);
            throw new RuntimeException("Order creation failed, stock released.");
        }
    }
}