package com.shopsphere.orderservice.publisher;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.orderservice.dto.event.OrderStateEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishOrderPaidEvent(OrderStateEvent event) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("order-paid-topic", jsonMessage);
            log.info("Published Order PAID event for order: {}", event.orderNumber());
        } catch (Exception e) {
            log.error("Failed to publish order paid event", e);
        }
    }

    public void publishOrderCancelledEvent(OrderStateEvent event) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("order-cancelled-topic", jsonMessage);
            log.info("Published Order CANCELLED event for order: {}", event.orderNumber());
        } catch (Exception e) {
            log.error("Failed to publish order cancelled event", e);
        }
    }
}