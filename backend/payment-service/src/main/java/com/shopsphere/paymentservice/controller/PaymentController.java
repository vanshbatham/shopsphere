package com.shopsphere.paymentservice.controller;

import com.shopsphere.paymentservice.service.PaymentService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Validated
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-intent/{orderId}")
    public ResponseEntity<Map<String, String>> createPaymentIntent(
            @PathVariable @NotBlank(message = "Order ID cannot be blank") String orderId) {

        String razorpayOrderId = paymentService.createPaymentIntent(orderId);

        // FIX: Key renamed from "clientSecret" to "razorpayOrderId".
        // This is Razorpay, not Stripe — there is no client secret.
        // The frontend uses this Order ID to open the Razorpay checkout modal.
        return ResponseEntity.ok(Map.of("razorpayOrderId", razorpayOrderId));
    }
}