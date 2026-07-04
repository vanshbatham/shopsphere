package com.shopsphere.orderservice.dto.response;


import com.shopsphere.orderservice.enums.DiscountType;

import java.math.BigDecimal;

public record CouponResponse(
        String code,
        DiscountType discountType,
        BigDecimal discountValue
) {
}