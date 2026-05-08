package com.shopsphere.userservice.dto.response;

import com.shopsphere.userservice.entity.Role;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        Role role,
        boolean isActive,
        boolean emailVerified,
        LocalDateTime createdAt
) {
}