package com.shopsphere.orderservice.dto.request;

import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(List<OrderLineItemDto> orderLineItems) {
    public record OrderLineItemDto(String skuCode, BigDecimal price, Integer quantity) {
    }
}