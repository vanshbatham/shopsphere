package com.shopsphere.productservice.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        String skuCode,
        String category,
        String imageUrl,
        String shopName,
        List<String> imageUrls
) {
}