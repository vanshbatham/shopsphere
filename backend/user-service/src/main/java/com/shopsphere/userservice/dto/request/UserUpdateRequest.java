package com.shopsphere.userservice.dto.request;

public record UserUpdateRequest(
        String firstName,
        String lastName,
        String phoneNumber,
        String email
) {
}