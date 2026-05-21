package com.shopsphere.userservice.service;


import com.shopsphere.userservice.dto.request.AddressRequest;
import com.shopsphere.userservice.dto.response.AddressResponse;
import com.shopsphere.userservice.entity.Address;
import com.shopsphere.userservice.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;

    public AddressResponse addAddress(String userId, AddressRequest request) {
        Address address = Address.builder()
                .userId(userId)
                .street(request.street())
                .city(request.city())
                .state(request.state())
                .zipCode(request.zipCode())
                .country(request.country())
                .build();

        Address savedAddress = addressRepository.save(address);
        return mapToResponse(savedAddress);
    }

    public List<AddressResponse> getUserAddresses(String userId) {
        return addressRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public AddressResponse getAddressById(Long addressId, String userId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or does not belong to user"));
        return mapToResponse(address);
    }

    private AddressResponse mapToResponse(Address address) {
        return new AddressResponse(
                address.getId(),
                address.getStreet(),
                address.getCity(),
                address.getState(),
                address.getZipCode(),
                address.getCountry()
        );
    }
}