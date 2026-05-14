package com.shopsphere.orderservice.dto.request;

import java.math.BigDecimal;

public record CartItemDto(
        String skuCode,
        BigDecimal snapshotPrice,
        Integer quantity) {
}