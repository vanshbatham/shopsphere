package com.shopsphere.paymentservice.exception;

/**
 * Thrown when createPaymentIntent is called before the Kafka consumer
 * has processed the OrderPlacedEvent and created the payment record.
 * <p>
 * Maps to HTTP 404 with retryable=true so the frontend knows to retry
 * with exponential backoff rather than treating this as a permanent failure.
 */
public class PaymentNotReadyException extends RuntimeException {
    public PaymentNotReadyException(String orderId) {
        super("Payment not yet initialized for Order ID: " + orderId + ". Retry shortly.");
    }
}