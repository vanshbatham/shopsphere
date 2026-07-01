package com.shopsphere.notificationservice.dto;

public record EmailVerificationRequestedEvent(
        String email,
        String firstName,
        String otpToken
) {
}