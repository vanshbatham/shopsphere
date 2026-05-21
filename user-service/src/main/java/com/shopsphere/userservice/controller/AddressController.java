package com.shopsphere.userservice.controller;


import com.shopsphere.userservice.dto.request.AddressRequest;
import com.shopsphere.userservice.dto.response.AddressResponse;
import com.shopsphere.userservice.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/addresses")
@RequiredArgsConstructor
@Tag(name = "Address Book", description = "Endpoints for managing user shipping addresses")
public class AddressController {

    private final AddressService addressService;

    @Operation(summary = "Add a new address", description = "Saves a new shipping address to the user's address book.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Address created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data")
    })
    @PostMapping
    public ResponseEntity<AddressResponse> addAddress(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.addAddress(userId, request));
    }

    @Operation(summary = "Get all user addresses", description = "Retrieves all saved addresses for the authenticated user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Addresses retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping
    public ResponseEntity<List<AddressResponse>> getUserAddresses(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(addressService.getUserAddresses(userId));
    }

    @Operation(summary = "Get a specific address", description = "Retrieves a single address by ID. Primarily used by internal microservices during checkout.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Address retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Address not found or does not belong to user")
    })
    @GetMapping("/{addressId}")
    public ResponseEntity<AddressResponse> getAddressById(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long addressId) {
        return ResponseEntity.ok(addressService.getAddressById(addressId, userId));
    }
}