package com.shopsphere.userservice.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Token is required")
        String token,

        @NotBlank(message = "New password is required")
        String newPassword
) {
}