package com.shopsphere.couponservice.dto.response;

import com.shopsphere.couponservice.entity.DiscountType;

import java.math.BigDecimal;

public record CouponResponse(
        String code,
        DiscountType discountType,
        BigDecimal discountValue
) {
}