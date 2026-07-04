package com.shopsphere.orderservice.dto.request;

import java.util.UUID;

public record AddressDto(
        UUID id,
        String street,
        String city,
        String state,
        String zipCode,
        String country
) {
}