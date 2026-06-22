package com.shopsphere.orderservice.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.orderservice.dto.event.PaymentProcessedEvent;
import com.shopsphere.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "payment-events-topic", groupId = "order-group")
    public void handlePaymentProcessedEvent(String message) {
        try {
            PaymentProcessedEvent event = objectMapper.readValue(message, PaymentProcessedEvent.class);
            log.info("Received PaymentProcessedEvent for Order: {}, Status: {}",
                    event.orderId(), event.status());

            if ("SUCCESS".equalsIgnoreCase(event.status())) {
                orderService.confirmOrderPayment(event.orderId());
            } else if ("FAILED".equalsIgnoreCase(event.status())) {
                orderService.handleFailedPayment(event.orderId());
            } else {
                log.warn("Unrecognized payment status '{}' for Order: {}. No action taken.",
                        event.status(), event.orderId());
            }
        } catch (Exception e) {
            log.error("CRITICAL: Failed to process PaymentProcessedEvent: {}", message, e);
        }
    }
}