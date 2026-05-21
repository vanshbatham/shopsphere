package com.shopsphere.orderservice.dto.request;

public record AddressDto(
        Long id,
        String street,
        String city,
        String state,
        String zipCode,
        String country
) {
}