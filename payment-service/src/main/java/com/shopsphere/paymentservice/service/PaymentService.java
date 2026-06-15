package com.shopsphere.paymentservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.shopsphere.paymentservice.dto.OrderPlacedEvent;
import com.shopsphere.paymentservice.dto.PaymentProcessedEvent;
import com.shopsphere.paymentservice.entity.Payment;
import com.shopsphere.paymentservice.entity.PaymentStatus;
import com.shopsphere.paymentservice.exception.PaymentGatewayException;
import com.shopsphere.paymentservice.exception.PaymentNotFoundException;
import com.shopsphere.paymentservice.exception.PaymentNotReadyException;
import com.shopsphere.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final RazorpayClient razorpay;

    // Triggered by Kafka when an order is placed
    @Transactional
    public void initializePayment(OrderPlacedEvent event) {
        Optional<Payment> existingPayment = paymentRepository.findByOrderId(event.orderId());
        if (existingPayment.isPresent()) return; // Idempotency check

        try {
            Payment payment = Payment.builder()
                    .orderId(event.orderId())
                    .amount(event.totalAmount())
                    .status(PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(payment);
            log.info("Payment initialized in DB for Order: {}", event.orderId());
        } catch (DataIntegrityViolationException e) {
            log.warn("Duplicate payment intercepted for Order: {}", event.orderId());
        }
    }

    // Called by React to get the Razorpay Order ID.
    // FIX: Throws PaymentNotReadyException (404) instead of RuntimeException (500).
    // This signals the frontend that the Kafka consumer hasn't processed the
    // OrderPlacedEvent yet — it should retry with exponential backoff.
    @Transactional
    public String createPaymentIntent(String orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new PaymentNotReadyException(orderId));

        try {
            // FIX: Use HALF_UP rounding before longValue() to prevent truncation.
            // e.g. ₹100.999 was becoming 10099 paise, now correctly rounds to 10100.
            long amountInPaise = payment.getAmount()
                    .multiply(new BigDecimal("100"))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValue();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", orderId);

            Order razorpayOrder = razorpay.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            payment.setPaymentGatewayTransactionId(razorpayOrderId);
            paymentRepository.save(payment);

            return razorpayOrderId;
        } catch (Exception e) {
            log.error("Failed to create Razorpay Order for orderId: {}", orderId, e);
            throw new PaymentGatewayException("Failed to initialize payment gateway.");
        }
    }

    // Called by the Webhook Controller
    @Transactional
    public void confirmPaymentWebhook(String razorpayOrderId, String status) {
        Payment payment = paymentRepository.findByPaymentGatewayTransactionId(razorpayOrderId)
                .orElseThrow(() -> new PaymentNotFoundException(razorpayOrderId));

        if (payment.getStatus() == PaymentStatus.COMPLETED) return;

        if ("SUCCESS".equalsIgnoreCase(status) || "order.paid".equalsIgnoreCase(status)) {
            payment.setStatus(PaymentStatus.COMPLETED);
            log.info("Payment confirmed via Razorpay webhook for Order: {}", payment.getOrderId());
            publishPaymentProcessedEvent(payment.getOrderId(), razorpayOrderId, "SUCCESS");

        } else if ("FAILED".equalsIgnoreCase(status)) {
            payment.setStatus(PaymentStatus.FAILED);
            log.error("Payment failed via Razorpay webhook for Order: {}", payment.getOrderId());
            publishPaymentProcessedEvent(payment.getOrderId(), razorpayOrderId, "FAILED");
        }

        paymentRepository.save(payment);
    }

    private void publishPaymentProcessedEvent(String orderId, String transactionId, String status) {
        try {
            PaymentProcessedEvent event = new PaymentProcessedEvent(orderId, transactionId, status);
            String jsonMessage = objectMapper.writeValueAsString(event);

            // FIX: Consume the returned Future and log failures instead of fire-and-forget.
            // If the broker is unreachable, the payment is confirmed in DB but the Order
            // Service won't be notified. The CRITICAL log is your alert to intervene.
            // Long-term: replace with a Transactional Outbox pattern.
            kafkaTemplate.send("payment-events-topic", jsonMessage)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("CRITICAL: Kafka publish failed for PaymentProcessedEvent, Order: {}. " +
                                    "Order Service will NOT be notified. Manual intervention required.", orderId, ex);
                        } else {
                            log.info("Published PaymentProcessedEvent to Kafka for Order: {}", orderId);
                        }
                    });

        } catch (JsonProcessingException e) {
            // This is a programming error, not a runtime failure — it should never happen
            // with a well-formed DTO. Rethrowing rolls back the @Transactional boundary,
            // which is correct: Razorpay will retry the webhook on a non-2xx response.
            log.error("CRITICAL: Failed to serialize PaymentProcessedEvent for Order: {}", orderId, e);
            throw new RuntimeException("Failed to serialize PaymentProcessedEvent", e);
        }
    }
}