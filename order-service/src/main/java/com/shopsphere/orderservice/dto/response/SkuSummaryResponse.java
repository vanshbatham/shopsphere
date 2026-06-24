package com.shopsphere.orderservice.dto.response;

import java.math.BigDecimal;

public record SkuSummaryResponse(
        String skuCode,
        int quantitySold,
        BigDecimal revenue
) {
}