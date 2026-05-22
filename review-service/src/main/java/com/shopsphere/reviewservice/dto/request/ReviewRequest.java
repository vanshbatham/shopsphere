package com.shopsphere.reviewservice.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @NotNull(message = "Product ID cannot be null")
        String productId,

        @NotNull(message = "Rating value is mandatory")
        @Min(value = 1, message = "Rating must be at least 1 star")
        @Max(value = 5, message = "Rating cannot exceed 5 stars")
        Integer rating,

        @Size(max = 1000, message = "Comment must not exceed 1000 characters")
        String comment
) {
}