package com.shopsphere.cartservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CartItemRequest(
        @NotBlank String skuCode,
        @NotNull @Min(0) BigDecimal snapshotPrice,
        @NotNull @Min(1) Integer quantity
) {
}