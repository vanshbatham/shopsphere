package com.shopsphere.inventoryservice.dto.event;

import java.util.Map;

public record StockAdjustmentEvent(
        String orderNumber,
        Map<String, Integer> skuQuantities
) {
}