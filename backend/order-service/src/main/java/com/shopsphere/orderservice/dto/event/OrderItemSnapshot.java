package com.shopsphere.orderservice.dto.event;

import java.math.BigDecimal;

public record OrderItemSnapshot(
        String name,
        String skuCode,
        int quantity,
        BigDecimal price
) {
}