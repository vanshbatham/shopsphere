package com.shopsphere.paymentservice.controller;

import com.razorpay.Utils;
import com.shopsphere.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments/webhook")
@RequiredArgsConstructor
@Slf4j
public class RazorpayWebhookController {

    private final PaymentService paymentService;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/razorpay")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        // FIX: Signature verification is isolated in its own try-catch.
        // Previously, a verification exception fell to the outer catch and returned 500,
        // which caused Razorpay to retry the webhook. Bad signatures must return 400
        // (permanent rejection, no retry).
        try {
            boolean isValid = Utils.verifyWebhookSignature(payload, signature, webhookSecret);
            if (!isValid) {
                log.error("Invalid Razorpay webhook signature — possible spoofed request");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
            }
        } catch (Exception e) {
            log.error("Signature verification threw an exception — treating as invalid", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        // Payload processing is separate. A 500 here tells Razorpay to retry, which is correct
        // behavior for genuine processing failures (DB down, Kafka unavailable, etc.).
        try {
            JSONObject jsonPayload = new JSONObject(payload);
            String eventType = jsonPayload.getString("event");

            switch (eventType) {
                case "order.paid" -> {
                    String razorpayOrderId = extractOrderId(jsonPayload);
                    log.info("order.paid webhook received for Razorpay Order ID: {}", razorpayOrderId);
                    paymentService.confirmPaymentWebhook(razorpayOrderId, "order.paid");
                }
                // FIX: payment.failed was completely unhandled. Failed payments were
                // never recorded, the Order Service was never notified, and payment records
                // sat in PENDING forever. The FAILED branch in PaymentService was dead code.
                case "payment.failed" -> {
                    String razorpayOrderId = extractOrderId(jsonPayload);
                    log.warn("payment.failed webhook received for Razorpay Order ID: {}", razorpayOrderId);
                    paymentService.confirmPaymentWebhook(razorpayOrderId, "FAILED");
                }
                default -> log.info("Unhandled Razorpay event type '{}' — ignoring", eventType);
            }

            return ResponseEntity.ok("Webhook Processed");

        } catch (Exception e) {
            log.error("Error processing Razorpay webhook payload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook processing failed");
        }
    }

    private String extractOrderId(JSONObject jsonPayload) {
        return jsonPayload
                .getJSONObject("payload")
                .getJSONObject("payment")
                .getJSONObject("entity")
                .getString("order_id");
    }
}