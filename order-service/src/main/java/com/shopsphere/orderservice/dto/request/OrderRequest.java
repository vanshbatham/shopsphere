package com.shopsphere.orderservice.dto.request;

import com.shopsphere.orderservice.enums.PaymentMethod;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(
        @NotEmpty(message = "Order must have at least one item")
        List<OrderLineItemDto> orderLineItems,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod
) {
    public record OrderLineItemDto(
            @NotNull(message = "SKU code is required")
            String skuCode,

            @NotNull(message = "Price is required")
            BigDecimal price,

            @NotNull(message = "Quantity is required")
            Integer quantity
    ) {
    }
}