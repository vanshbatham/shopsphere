package com.shopsphere.cartservice.dto.response;

import java.math.BigDecimal;

public record ProductResponse(
        String skuCode,
        String name,
        BigDecimal price) {
}