package com.shopsphere.reviewservice.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        String productId,
        String userId,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {
}