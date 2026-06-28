package com.shopsphere.orderservice.dto.event;

public record ShippingAddressSnapshot(
        String street,
        String city,
        String state,
        String zipCode,
        String country
) {
}