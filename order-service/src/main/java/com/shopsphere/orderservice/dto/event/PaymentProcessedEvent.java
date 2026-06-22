package com.shopsphere.orderservice.dto.event;

public record PaymentProcessedEvent(
        String orderId,
        String paymentId,
        String status // "SUCCESS" or "FAILED"
) {
}