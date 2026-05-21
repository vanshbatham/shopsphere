package com.shopsphere.paymentservice.controller;

import com.shopsphere.paymentservice.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments/webhook")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final PaymentService paymentService;

    // Note: In production, Webhooks do NOT use JWTs. Stripe doesn't know our JWTs.
    // Instead, they use a cryptographic signature in the headers to prove authenticity.
    // For this simulation, accept a simple JSON payload.
    @Operation(summary = "Handle Stripe Webhook", description = "Endpoint to receive payment status updates from Stripe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Webhook processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid webhook payload")
    })
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(@RequestBody Map<String, String> payload) {
        String orderId = payload.get("orderId");
        String transactionId = payload.get("transactionId");
        String status = payload.get("status");

        paymentService.confirmPaymentWebhook(orderId, transactionId, status);
        return ResponseEntity.ok("Webhook Processed");
    }
}