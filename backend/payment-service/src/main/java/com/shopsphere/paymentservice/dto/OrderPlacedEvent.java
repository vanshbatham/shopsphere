package com.shopsphere.paymentservice.dto;

import java.math.BigDecimal;

// this represents the exact payload the Order Service will drop into Kafka
public record OrderPlacedEvent(
        String orderId,
        String userId,
        BigDecimal totalAmount
) {
}