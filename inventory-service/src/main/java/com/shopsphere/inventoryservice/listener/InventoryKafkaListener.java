package com.shopsphere.inventoryservice.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.inventoryservice.dto.event.StockAdjustmentEvent;
import com.shopsphere.inventoryservice.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryKafkaListener {

    private final InventoryService inventoryService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "order-paid-topic", groupId = "inventory-group")
    public void handleOrderPaidEvent(String message) {
        try {
            log.info("Received Order PAID event: {}", message);
            StockAdjustmentEvent event = objectMapper.readValue(message, StockAdjustmentEvent.class);

            inventoryService.deductReservedStock(event.skuQuantities());
        } catch (Exception e) {
            log.error("Error processing order-paid-topic message", e);
        }
    }

    @KafkaListener(topics = "order-cancelled-topic", groupId = "inventory-group")
    public void handleOrderCancelledEvent(String message) {
        try {
            log.info("Received Order CANCELLED event: {}", message);
            StockAdjustmentEvent event = objectMapper.readValue(message, StockAdjustmentEvent.class);
            
            inventoryService.releaseReservedStock(event.skuQuantities());

        } catch (Exception e) {
            log.error("Error processing order-cancelled-topic message", e);
        }
    }
}