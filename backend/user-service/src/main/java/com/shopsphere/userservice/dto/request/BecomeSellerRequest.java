package com.shopsphere.userservice.dto.request;

import jakarta.validation.constraints.NotBlank;

public record BecomeSellerRequest(
        @NotBlank(message = "Shop name is required")
        String shopName,

        String shopDescription
) {
}