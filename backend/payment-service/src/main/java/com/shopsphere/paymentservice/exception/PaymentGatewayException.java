package com.shopsphere.paymentservice.exception;

/**
 * Thrown when the Razorpay API call itself fails
 * (network error, API key issue, Razorpay downtime, etc).
 * <p>
 * Maps to HTTP 502 Bad Gateway — the problem is upstream, not with the client's request.
 */
public class PaymentGatewayException extends RuntimeException {
    public PaymentGatewayException(String message) {
        super(message);
    }
}