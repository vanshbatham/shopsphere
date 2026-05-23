package com.shopsphere.couponservice.service;

import com.shopsphere.couponservice.dto.request.CouponCreateRequest;
import com.shopsphere.couponservice.dto.response.CouponResponse;
import com.shopsphere.couponservice.entity.Coupon;
import com.shopsphere.couponservice.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional
    public CouponResponse createCoupon(CouponCreateRequest request) {
        Coupon coupon = Coupon.builder()
                .code(request.code().toUpperCase())
                .discountType(request.discountType())
                .discountValue(request.discountValue())
                .expirationDate(request.expirationDate())
                .usageLimit(request.usageLimit())
                .usageCount(0)
                .build();
        return mapToResponse(couponRepository.save(coupon));
    }

    // Standard Read for Cart Totals
    @Transactional(readOnly = true)
    public CouponResponse validateCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));

        checkValidity(coupon);
        return mapToResponse(coupon);
    }

    // THE CRITICAL TRANSACTION: Pessimistic locking for Checkout
    @Transactional
    public CouponResponse consumeCoupon(String code) {
        log.info("Attempting to acquire row-level lock for coupon: {}", code);

        Coupon coupon = couponRepository.findByCodeWithLock(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));

        checkValidity(coupon);

        log.info("Lock acquired. Coupon is valid. Incrementing usage.");
        coupon.setUsageCount(coupon.getUsageCount() + 1);
        couponRepository.save(coupon); // lock is released automatically when transaction commits

        return mapToResponse(coupon);
    }

    private void checkValidity(Coupon coupon) {
        if (coupon.getExpirationDate().isBefore(LocalDate.now())) {
            throw new IllegalStateException("This coupon has expired.");
        }
        if (coupon.getUsageCount() >= coupon.getUsageLimit()) {
            throw new IllegalStateException("This coupon has reached its maximum usage limit.");
        }
    }

    private CouponResponse mapToResponse(Coupon coupon) {
        return new CouponResponse(
                coupon.getCode(),
                coupon.getDiscountType(),
                coupon.getDiscountValue()
        );
    }
}