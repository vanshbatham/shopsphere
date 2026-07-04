package com.shopsphere.userservice.dto.request;

import jakarta.validation.constraints.NotBlank;

public record EmailVerificationConfirmRequest(
        @NotBlank(message = "Verification code is required")
        String otp
) {
}