package com.shopsphere.notificationservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.notificationservice.dto.PasswordResetRequestedEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "password-reset-topic", groupId = "notification-group")
    public void handlePasswordResetRequest(String message) {
        try {
            // 1. Parse the JSON from Kafka back into our Java Record
            PasswordResetRequestedEvent event = objectMapper.readValue(message, PasswordResetRequestedEvent.class);
            log.info("Received password reset event for email: {}", event.email());

            // 2. Build the Email
            sendResetEmail(event.email(), event.firstName(), event.otpToken());

        } catch (Exception e) {
            log.error("Failed to process password reset event", e);
        }
    }

    private void sendResetEmail(String toEmail, String firstName, String otp) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

        // Constructing a nice HTML email
        String htmlMsg = String.format(
                "<h3>Hello %s,</h3>" +
                        "<p>We received a request to reset your password for ShopSphere.</p>" +
                        "<p>Your 6-digit verification code is: <strong><span style=\"font-size: 24px; color: #4CAF50;\">%s</span></strong></p>" +
                        "<p>This code will expire in 15 minutes.</p>" +
                        "<p>If you did not request this, please ignore this email.</p>",
                firstName, otp
        );

        helper.setText(htmlMsg, true); // true indicates this is HTML
        helper.setTo(toEmail);
        helper.setSubject("ShopSphere - Password Reset Verification Code");
        helper.setFrom("security@shopsphere.com");

        mailSender.send(mimeMessage);
        log.info("Password reset email successfully sent to MailHog for: {}", toEmail);
    }
}