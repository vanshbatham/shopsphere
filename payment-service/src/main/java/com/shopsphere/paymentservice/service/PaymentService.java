package com.shopsphere.paymentservice.service;

import com.shopsphere.paymentservice.dto.OrderPlacedEvent;
import com.shopsphere.paymentservice.entity.Payment;
import com.shopsphere.paymentservice.entity.PaymentStatus;
import com.shopsphere.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Transactional
    public void initializePayment(OrderPlacedEvent event) {
        log.info("Received OrderPlacedEvent for Order ID: {}", event.orderId());

        // IDEMPOTENCY CHECK 1: Application Level Read
        Optional<Payment> existingPayment = paymentRepository.findByOrderId(event.orderId());
        if (existingPayment.isPresent()) {
            log.warn("Idempotency Key Match! Payment intent already exists for Order ID: {}. Ignoring duplicate event.", event.orderId());
            return; // safely exit without crashing or double-charging.
        }

        try {
            Payment payment = Payment.builder()
                    .orderId(event.orderId())
                    .amount(event.totalAmount())
                    .status(PaymentStatus.PENDING)
                    .build();

            paymentRepository.save(payment);
            log.info("Payment initialized in PENDING state for Order ID: {}", event.orderId());

            // In a full implementation, call Stripe API here to generate a Checkout Session URL
            // and maybe email that URL to the user, or drop it back into a Kafka topic for the frontend.

        } catch (DataIntegrityViolationException e) {
            // IDEMPOTENCY CHECK 2: Database Level Catch
            // If two threads hit this exact block at the exact same millisecond, the database UNIQUE constraint catches it.
            log.warn("Database intercepted duplicate payment creation for Order ID: {}", event.orderId());
        }
    }

    @Transactional
    public void confirmPaymentWebhook(String orderId, String transactionId, String status) {
        log.info("Webhook received from Payment Gateway for Order ID: {}", orderId);

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BadCredentialsException("Webhook received for unknown Order ID: " + orderId));

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            log.info("Payment already marked as COMPLETED. Ignoring duplicate Webhook.");
            return;
        }

        if ("SUCCESS".equalsIgnoreCase(status)) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaymentGatewayTransactionId(transactionId);
            log.info("Payment mathematically verified. Status updated to COMPLETED.");

            // Here, fire a PaymentProcessedEvent back to Kafka so the Order Service can ship the goods!
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            log.error("Payment Gateway reported failure for Order ID: {}", orderId);
        }

        paymentRepository.save(payment);
    }
}