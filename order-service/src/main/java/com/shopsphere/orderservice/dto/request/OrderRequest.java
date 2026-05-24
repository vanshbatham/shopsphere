package com.shopsphere.orderservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OrderRequest(
        @NotBlank(message = "Payment method is required")
        String paymentMethod,

        @NotNull(message = "Address ID is required to ship the order")
        UUID addressId,

        String couponCode
) {
}