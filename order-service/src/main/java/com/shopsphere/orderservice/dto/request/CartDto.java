package com.shopsphere.orderservice.dto.request;

import java.util.List;

public record CartDto(
        String id,
        List<CartItemDto> items) {
}