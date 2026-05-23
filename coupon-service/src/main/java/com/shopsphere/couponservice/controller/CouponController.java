package com.shopsphere.couponservice.controller;


import com.shopsphere.couponservice.dto.request.CouponCreateRequest;
import com.shopsphere.couponservice.dto.response.CouponResponse;
import com.shopsphere.couponservice.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupon Engine", description = "Financial promotion limits and consumption")
public class CouponController {

    private final CouponService couponService;

    @PostMapping
    @Operation(summary = "Create Coupon", description = "Admin only. Generates a new promotion.")
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CouponCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.createCoupon(request));
    }

    @GetMapping("/validate/{code}")
    @Operation(summary = "Validate Coupon", description = "Checks validity and returns discount details without consuming it.")
    public ResponseEntity<CouponResponse> validateCoupon(@PathVariable String code) {
        return ResponseEntity.ok(couponService.validateCoupon(code));
    }

    @PostMapping("/consume/{code}")
    @Operation(summary = "Consume Coupon (Pessimistic Lock)", description = "Internal endpoint. Safely increments usage limit during checkout.")
    public ResponseEntity<CouponResponse> consumeCoupon(@PathVariable String code) {
        return ResponseEntity.ok(couponService.consumeCoupon(code));
    }
}