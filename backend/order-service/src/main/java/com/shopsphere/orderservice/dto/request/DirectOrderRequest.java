package com.shopsphere.orderservice.dto.request;

public record DirectOrderRequest(
        String addressId,
        String paymentMethod,
        String couponCode,
        String skuCode,
        Integer quantity
) {
}