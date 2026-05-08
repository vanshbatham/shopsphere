package com.shopsphere.userservice.dto.response;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Long expiresIn
) {
}
