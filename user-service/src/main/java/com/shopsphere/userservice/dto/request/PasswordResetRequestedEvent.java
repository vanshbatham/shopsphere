package com.shopsphere.userservice.dto.request;

public record PasswordResetRequestedEvent(
        String email,
        String firstName,
        String otpToken
) {
}