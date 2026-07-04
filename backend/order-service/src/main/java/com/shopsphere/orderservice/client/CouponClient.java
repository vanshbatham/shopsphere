package com.shopsphere.orderservice.client;

import com.shopsphere.orderservice.dto.response.CouponResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "coupon-service")
public interface CouponClient {

    @PostMapping("/api/v1/coupons/consume/{code}")
    CouponResponse consumeCoupon(@PathVariable("code") String code);
}