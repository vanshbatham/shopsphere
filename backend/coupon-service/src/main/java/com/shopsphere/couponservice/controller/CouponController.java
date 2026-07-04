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

import java.util.List;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupon Engine", description = "Financial promotion limits and consumption")
public class CouponController {

    private final CouponService couponService;

    @PostMapping
    @Operation(summary = "Create Coupon", description = "Admin only. Generates a new promotion.")
    public ResponseEntity<CouponResponse> createCoupon(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody CouponCreateRequest request) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.createCoupon(request));
    }

    @GetMapping
    @Operation(summary = "Get All Coupons", description = "Admin only. Retrieves all coupons for management purposes.")
    public ResponseEntity<List<CouponResponse>> getAllCoupons(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @GetMapping("/validate/{code}")
    @Operation(summary = "Validate Coupon", description = "Public. Checks validity and returns discount details without consuming it.")
    public ResponseEntity<CouponResponse> validateCoupon(@PathVariable String code) {
        // Anyone checking out can validate a coupon to see the discount math.
        return ResponseEntity.ok(couponService.validateCoupon(code));
    }

    @PostMapping("/consume/{code}")
    @Operation(summary = "Consume Coupon (Pessimistic Lock)", description = "Internal endpoint. Safely increments usage limit during checkout.")
    public ResponseEntity<CouponResponse> consumeCoupon(@PathVariable String code) {
        // No role check here because the user isn't making this call—the Order Service is.
        return ResponseEntity.ok(couponService.consumeCoupon(code));
    }
}