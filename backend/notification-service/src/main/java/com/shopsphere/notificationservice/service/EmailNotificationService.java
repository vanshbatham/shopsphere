package com.shopsphere.notificationservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.notificationservice.dto.*;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    
    @Value("${spring.mail.username}")
    private String fromAddress;

    private static final String BRAND_DARK = "#0f172a";
    private static final String BORDER_LIGHT = "#e5e7eb";
    private static final String TEXT_MUTED = "#6b7280";
    private static final String TEXT_DARK = "#111827";
    private static final String BG_PAGE = "#f4f4f5";

    @KafkaListener(topics = "password-reset-topic", groupId = "notification-group")
    public void handlePasswordResetRequest(String message) {
        try {
            PasswordResetRequestedEvent event = objectMapper.readValue(message, PasswordResetRequestedEvent.class);
            log.info("Received password reset event for email: {}", event.email());
            sendResetEmail(event.email(), event.firstName(), event.otpToken());
        } catch (Exception e) {
            log.error("Failed to process password reset event", e);
        }
    }

    @KafkaListener(topics = "email-verification-topic", groupId = "notification-group")
    public void handleEmailVerificationRequest(String message) {
        try {
            EmailVerificationRequestedEvent event =
                    objectMapper.readValue(message, EmailVerificationRequestedEvent.class);
            log.info("Received email verification event for: {}", event.email());
            sendVerificationEmail(event.email(), event.firstName(), event.otpToken());
        } catch (Exception e) {
            log.error("Failed to process email verification event", e);
        }
    }

    @KafkaListener(topics = "order-notification-topic", groupId = "notification-group")
    public void handleOrderStatusNotification(String message) {
        try {
            OrderStatusNotificationEvent event = objectMapper.readValue(message, OrderStatusNotificationEvent.class);
            log.info("Received {} notification event for order {} ({})",
                    event.status(), event.orderId(), event.email());
            sendOrderStatusEmail(event);
        } catch (Exception e) {
            log.error("Failed to process order status notification event", e);
        }
    }

    private void sendResetEmail(String toEmail, String firstName, String otp) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

        String htmlMsg = String.format(
                "<h3>Hello %s,</h3>" +
                        "<p>We received a request to reset your password for ShopSphere.</p>" +
                        "<p>Your 6-digit verification code is: <strong><span style=\"font-size: 24px; color: #4CAF50;\">%s</span></strong></p>" +
                        "<p>This code will expire in 15 minutes.</p>" +
                        "<p>If you did not request this, please ignore this email.</p>",
                firstName, otp
        );

        helper.setText(htmlMsg, true);
        helper.setTo(toEmail);
        helper.setSubject("ShopSphere - Password Reset Verification Code");
        helper.setFrom(fromAddress);

        mailSender.send(mimeMessage);
        log.info("Password reset email successfully sent to: {}", toEmail);
    }

    private void sendVerificationEmail(String toEmail, String firstName, String otp) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

        helper.setText(buildVerificationEmailHtml(firstName, otp), true);
        helper.setTo(toEmail);
        helper.setSubject("ShopSphere - Verify Your Email Address");
        helper.setFrom(fromAddress);

        mailSender.send(mimeMessage);
        log.info("Email verification code successfully sent to: {}", toEmail);
    }

    private String buildVerificationEmailHtml(String firstName, String otp) {
        String name = firstName != null ? firstName : "there";

        StringBuilder html = new StringBuilder();
        html.append("<div style=\"background:").append(BG_PAGE).append(";padding:32px 16px;font-family:Arial,Helvetica,sans-serif;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;\">");

        // Header banner
        html.append("<tr><td style=\"background:").append(BRAND_DARK).append(";padding:28px 32px;\">");
        html.append("<span style=\"font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:-0.02em;\">ShopSphere</span>");
        html.append("</td></tr>");

        // Body
        html.append("<tr><td style=\"padding:32px 32px 8px 32px;\">");
        html.append("<h2 style=\"margin:0 0 4px 0;font-size:18px;color:").append(TEXT_DARK).append(";\">Hello ").append(escape(name)).append(",</h2>");
        html.append("<p style=\"margin:0;font-size:14px;color:").append(TEXT_MUTED).append(";line-height:1.5;\">Use the code below to verify your email address on ShopSphere.</p>");
        html.append("</td></tr>");

        // OTP block
        html.append("<tr><td style=\"padding:24px 32px 0 32px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f9fafb;border-radius:8px;\"><tr><td align=\"center\" style=\"padding:24px;\">");
        html.append("<span style=\"font-size:32px;font-weight:bold;letter-spacing:0.15em;color:").append(BRAND_DARK).append(";\">").append(escape(otp)).append("</span>");
        html.append("</td></tr></table>");
        html.append("</td></tr>");

        // Expiry note
        html.append("<tr><td style=\"padding:16px 32px 0 32px;\">");
        html.append("<p style=\"margin:0;font-size:13px;color:").append(TEXT_MUTED).append(";\">This code will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>");
        html.append("</td></tr>");

        // Footer
        html.append("<tr><td style=\"padding:32px 32px 28px 32px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td style=\"border-top:1px solid ")
                .append(BORDER_LIGHT).append(";padding-top:20px;\">");
        html.append("<p style=\"margin:0;font-size:13px;color:").append(TEXT_MUTED).append(";\">Thanks for using ShopSphere.</p>");
        html.append("</td></tr></table>");
        html.append("</td></tr>");

        html.append("</table>");
        html.append("</div>");
        return html.toString();
    }

    private void sendOrderStatusEmail(OrderStatusNotificationEvent event) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

        helper.setText(buildOrderEmailHtml(event), true);
        helper.setTo(event.email());
        helper.setSubject(subjectForStatus(event.status(), event.orderNumber()));
        helper.setFrom(fromAddress);

        mailSender.send(mimeMessage);
        log.info("Order {} email successfully sent to: {}", event.status(), event.email());
    }

    // ─── Status display config ─────────────────────────────────────────────

    private String subjectForStatus(String status, String orderNumber) {
        String shortId = shortOrderId(orderNumber);
        return switch (status) {
            case "PLACED" -> "ShopSphere - Order Confirmed #" + shortId;
            case "SHIPPED" -> "ShopSphere - Your Order Has Shipped #" + shortId;
            case "DELIVERED" -> "ShopSphere - Your Order Has Been Delivered #" + shortId;
            case "CANCELLED" -> "ShopSphere - Order Cancelled #" + shortId;
            default -> "ShopSphere - Order Update #" + shortId;
        };
    }

    private String statusColor(String status) {
        return switch (status) {
            case "PLACED" -> "#2563eb";     // blue
            case "SHIPPED" -> "#171717";    // near-black, matches app's "Shipped" badge
            case "DELIVERED" -> "#059669";  // emerald
            case "CANCELLED" -> "#dc2626";  // red
            default -> "#6b7280";
        };
    }

    private String statusLabel(String status) {
        return switch (status) {
            case "PLACED" -> "Order Confirmed";
            case "SHIPPED" -> "Shipped";
            case "DELIVERED" -> "Delivered";
            case "CANCELLED" -> "Cancelled";
            default -> "Update";
        };
    }

    private String statusLine(String status) {
        return switch (status) {
            case "PLACED" -> "We've received your order and it's now being processed.";
            case "SHIPPED" -> "Good news — your order is on its way!";
            case "DELIVERED" -> "Your order has been delivered. We hope you enjoy it!";
            case "CANCELLED" -> "Your order has been cancelled. If this was unexpected, please contact support.";
            default -> "There's an update on your order.";
        };
    }

    private String shortOrderId(String orderNumber) {
        if (orderNumber == null) return "";
        return orderNumber.length() >= 8 ? orderNumber.substring(0, 8).toUpperCase() : orderNumber.toUpperCase();
    }

    // ─── HTML template ──────────────────────────────────────────────────────
    // Built with nested tables + inline styles only — email clients (Gmail,
    // Outlook especially) strip <style> blocks and ignore most modern CSS,
    // so table layout + inline styles is still the only reliably-renders-
    // everywhere approach.

    private String buildOrderEmailHtml(OrderStatusNotificationEvent event) {
        String name = event.firstName() != null ? event.firstName() : "there";
        String color = statusColor(event.status());
        String label = statusLabel(event.status());
        String shortId = shortOrderId(event.orderNumber());

        StringBuilder html = new StringBuilder();
        html.append("<div style=\"background:").append(BG_PAGE).append(";padding:32px 16px;font-family:Arial,Helvetica,sans-serif;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;\">");

        // ── Header banner ──
        html.append("<tr><td style=\"background:").append(BRAND_DARK).append(";padding:28px 32px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>");
        html.append("<td style=\"font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:-0.02em;\">ShopSphere</td>");
        html.append("<td align=\"right\">");
        html.append("<span style=\"display:inline-block;background:").append(color).append(";color:#ffffff;font-size:11px;font-weight:bold;letter-spacing:0.05em;text-transform:uppercase;padding:6px 14px;border-radius:999px;\">").append(label).append("</span>");
        html.append("</td></tr></table>");
        html.append("</td></tr>");

        // ── Greeting + status line ──
        html.append("<tr><td style=\"padding:32px 32px 8px 32px;\">");
        html.append("<h2 style=\"margin:0 0 4px 0;font-size:18px;color:").append(TEXT_DARK).append(";\">Hello ").append(escape(name)).append(",</h2>");
        html.append("<p style=\"margin:0;font-size:14px;color:").append(TEXT_MUTED).append(";line-height:1.5;\">").append(statusLine(event.status())).append("</p>");
        html.append("</td></tr>");

        // ── Order meta row ──
        html.append("<tr><td style=\"padding:16px 32px 0 32px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f9fafb;border-radius:8px;\"><tr>");
        html.append("<td style=\"padding:14px 16px;font-size:13px;color:").append(TEXT_MUTED).append(";\">Order ID</td>");
        html.append("<td align=\"right\" style=\"padding:14px 16px;font-size:13px;font-weight:bold;color:").append(TEXT_DARK).append(";\">#").append(shortId).append("</td>");
        html.append("</tr></table>");
        html.append("</td></tr>");

        // ── Item list ──
        if (event.items() != null && !event.items().isEmpty()) {
            html.append("<tr><td style=\"padding:24px 32px 0 32px;\">");
            html.append("<h3 style=\"margin:0 0 12px 0;font-size:13px;font-weight:bold;color:").append(TEXT_DARK).append(";text-transform:uppercase;letter-spacing:0.03em;\">Order Summary</h3>");
            html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">");
            for (OrderItemSnapshot item : event.items()) {
                BigDecimal lineTotal = item.price() != null
                        ? item.price().multiply(BigDecimal.valueOf(item.quantity()))
                        : BigDecimal.ZERO;
                html.append("<tr style=\"border-bottom:1px solid ").append(BORDER_LIGHT).append(";\">");
                html.append("<td style=\"padding:10px 0;font-size:14px;color:").append(TEXT_DARK).append(";\">")
                        .append(escape(item.name()))
                        .append("<br/><span style=\"font-size:12px;color:").append(TEXT_MUTED).append(";\">Qty ")
                        .append(item.quantity()).append("</span></td>");
                html.append("<td align=\"right\" style=\"padding:10px 0;font-size:14px;font-weight:bold;color:").append(TEXT_DARK).append(";white-space:nowrap;\">")
                        .append(formatAmount(lineTotal)).append("</td>");
                html.append("</tr>");
            }
            // Total row
            html.append("<tr><td style=\"padding:14px 0 0 0;font-size:15px;font-weight:bold;color:").append(TEXT_DARK).append(";\">Total</td>");
            html.append("<td align=\"right\" style=\"padding:14px 0 0 0;font-size:18px;font-weight:bold;color:").append(TEXT_DARK).append(";white-space:nowrap;\">")
                    .append(formatAmount(event.totalAmount())).append("</td></tr>");
            html.append("</table>");
            html.append("</td></tr>");
        } else {
            // Fallback if no items were resolved — still show the total.
            html.append("<tr><td style=\"padding:24px 32px 0 32px;\">");
            html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>");
            html.append("<td style=\"font-size:15px;font-weight:bold;color:").append(TEXT_DARK).append(";\">Total</td>");
            html.append("<td align=\"right\" style=\"font-size:18px;font-weight:bold;color:").append(TEXT_DARK).append(";\">")
                    .append(formatAmount(event.totalAmount())).append("</td>");
            html.append("</tr></table>");
            html.append("</td></tr>");
        }

        // ── Shipping address ──
        ShippingAddressSnapshot addr = event.shippingAddress();
        if (addr != null) {
            html.append("<tr><td style=\"padding:24px 32px 0 32px;\">");
            html.append("<h3 style=\"margin:0 0 8px 0;font-size:13px;font-weight:bold;color:").append(TEXT_DARK).append(";text-transform:uppercase;letter-spacing:0.03em;\">Shipping Address</h3>");
            html.append("<p style=\"margin:0;font-size:14px;color:").append(TEXT_MUTED).append(";line-height:1.6;\">");
            html.append(escape(addr.street())).append("<br/>");
            html.append(escape(addr.city())).append(", ").append(escape(addr.state())).append("<br/>");
            html.append(escape(addr.zipCode())).append(", ").append(escape(addr.country()));
            html.append("</p>");
            html.append("</td></tr>");
        }

        // ── Footer ──
        html.append("<tr><td style=\"padding:32px 32px 28px 32px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td style=\"border-top:1px solid ")
                .append(BORDER_LIGHT).append(";padding-top:20px;\">");
        html.append("<p style=\"margin:0;font-size:13px;color:").append(TEXT_MUTED).append(";\">Thanks for shopping with ShopSphere.</p>");
        html.append("</td></tr></table>");
        html.append("</td></tr>");

        html.append("</table>");
        html.append("</div>");
        return html.toString();
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "₹0";
        NumberFormat nf = NumberFormat.getNumberInstance(new Locale("en", "IN"));
        nf.setMaximumFractionDigits(0);
        return "₹" + nf.format(amount.setScale(0, RoundingMode.HALF_UP));
    }

    // Minimal HTML-escaping for user-influenced fields (name, address) so a
    // stray "<" or "&" in someone's address doesn't break the layout.
    private String escape(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}