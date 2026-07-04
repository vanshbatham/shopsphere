package com.shopsphere.paymentservice.listener;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.paymentservice.dto.OrderPlacedEvent;
import com.shopsphere.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventListener {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    // listens to the same topic the Order Service drops messages into
    @KafkaListener(topics = "order-events-topic", groupId = "payment-group")
    public void handleOrderPlacedEvent(String message) {
        try {
            // deserialize the JSON string back into our Java Record
            OrderPlacedEvent event = objectMapper.readValue(message, OrderPlacedEvent.class);
            paymentService.initializePayment(event);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse Kafka message: {}", e.getMessage());
        }
    }
}