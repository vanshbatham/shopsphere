package com.shopsphere.notificationservice.dto;

import java.math.BigDecimal;

public record OrderItemSnapshot(
        String name,
        String skuCode,
        int quantity,
        BigDecimal price
) {
}