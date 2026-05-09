package com.shopsphere.inventoryservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InventoryRequest(
        @NotBlank String skuCode,
        @NotNull @Min(1) Integer quantity
) {
}