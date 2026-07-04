package com.shopsphere.couponservice.dto.request;

import com.shopsphere.couponservice.entity.DiscountType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CouponCreateRequest(
        @NotBlank(message = "Coupon code is required") String code,
        @NotNull(message = "Discount type is required") DiscountType discountType,
        @NotNull(message = "Discount value is required") @Positive BigDecimal discountValue,
        @NotNull(message = "Expiration date is required") @Future LocalDate expirationDate,
        @NotNull(message = "Usage limit is required") @Min(1) Integer usageLimit
) {
}