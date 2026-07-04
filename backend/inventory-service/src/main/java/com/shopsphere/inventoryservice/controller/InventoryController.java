package com.shopsphere.inventoryservice.controller;

import com.shopsphere.inventoryservice.dto.request.InventoryRequest;
import com.shopsphere.inventoryservice.dto.response.InventoryResponse;
import com.shopsphere.inventoryservice.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory Management", description = "Endpoints for managing product inventory, including stock levels, reservations, and releases")
public class InventoryController {

    private final InventoryService inventoryService;

    @Operation(summary = "Add stock for a product", description = "Adds a specified quantity of stock for a given SKU code.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Stock added successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PostMapping("/add")
    public ResponseEntity<String> addStock(@RequestHeader("X-User-Role") String role,
                                           @Valid @RequestBody InventoryRequest request) {

        if (!"SELLER".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access Denied: You do not have permission to modify inventory.");
        }
        
        inventoryService.addStock(request.skuCode(), request.quantity());
        return ResponseEntity.status(HttpStatus.CREATED).body("Stock added successfully");
    }

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock level retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @GetMapping("/{skuCode}")
    public ResponseEntity<InventoryResponse> checkStock(@PathVariable String skuCode) {
        return ResponseEntity.ok(inventoryService.checkStock(skuCode));
    }

    @Operation(summary = "Reserve stock for an order", description = "Reserves a specified quantity of stock for a given SKU code, typically used during the checkout process.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock reserved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "Insufficient stock available")
    })
    @PostMapping("/reserve")
    public ResponseEntity<Boolean> reserveStock(@Valid @RequestBody InventoryRequest request) {
        boolean reserved = inventoryService.reserveStock(request);
        return reserved ? ResponseEntity.ok(true) : ResponseEntity.status(HttpStatus.CONFLICT).body(false);
    }

    @Operation(summary = "Release reserved stock", description = "Releases previously reserved stock for a given SKU code, typically used when an order is canceled or modified.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock released successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PostMapping("/release")
    public ResponseEntity<Void> releaseStock(@Valid @RequestBody InventoryRequest request) {
        inventoryService.releaseStock(request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Deduct stock for an order", description = "Permanently deducts a specified quantity of stock for a given SKU code, typically used when an order is completed.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock deducted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "Insufficient stock available")
    })
    @PostMapping("/deduct")
    public ResponseEntity<Void> deductStock(@Valid @RequestBody InventoryRequest request) {
        inventoryService.deductStock(request);
        return ResponseEntity.ok().build();
    }
}