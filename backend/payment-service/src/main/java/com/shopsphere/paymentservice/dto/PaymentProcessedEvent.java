package com.shopsphere.paymentservice.dto;

// this represents the payload the Payment Service will drop into Kafka once Stripe verifies funds
public record PaymentProcessedEvent(
        String orderId,
        String paymentId,
        String status
) {
}