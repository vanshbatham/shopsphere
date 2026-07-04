package com.shopsphere.paymentservice.exception;

/**
 * Thrown when a webhook arrives referencing a Razorpay Order ID
 * that does not exist in our database.
 * <p>
 * Maps to HTTP 404.
 */
public class PaymentNotFoundException extends RuntimeException {
    public PaymentNotFoundException(String razorpayOrderId) {
        super("Unknown Razorpay Order ID: " + razorpayOrderId);
    }
}