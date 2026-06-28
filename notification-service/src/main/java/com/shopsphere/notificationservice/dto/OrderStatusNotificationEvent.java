package com.shopsphere.notificationservice.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderStatusNotificationEvent(
        String email,
        String firstName,
        String orderId,
        String orderNumber,
        BigDecimal totalAmount,
        String status,
        List<OrderItemSnapshot> items,
        ShippingAddressSnapshot shippingAddress
) {
}