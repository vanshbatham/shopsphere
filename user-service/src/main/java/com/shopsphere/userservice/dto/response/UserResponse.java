package com.shopsphere.userservice.dto.response;

import com.shopsphere.userservice.entity.Role;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        Role role,
        boolean isActive,
        boolean emailVerified,
        LocalDateTime createdAt
) {
}