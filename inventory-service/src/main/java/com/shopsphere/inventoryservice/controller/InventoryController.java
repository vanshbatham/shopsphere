package com.shopsphere.inventoryservice.controller;


import com.shopsphere.inventoryservice.dto.request.InventoryRequest;
import com.shopsphere.inventoryservice.dto.response.InventoryResponse;
import com.shopsphere.inventoryservice.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/add")
    public ResponseEntity<String> addStock(@Valid @RequestBody InventoryRequest request) {
        inventoryService.addStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("Stock added successfully");
    }

    @GetMapping("/{skuCode}")
    public ResponseEntity<InventoryResponse> checkStock(@PathVariable String skuCode) {
        return ResponseEntity.ok(inventoryService.checkStock(skuCode));
    }

    @PostMapping("/reserve")
    public ResponseEntity<Boolean> reserveStock(@Valid @RequestBody InventoryRequest request) {
        boolean reserved = inventoryService.reserveStock(request);
        return reserved ? ResponseEntity.ok(true) : ResponseEntity.status(HttpStatus.CONFLICT).body(false);
    }

    @PostMapping("/release")
    public ResponseEntity<Void> releaseStock(@Valid @RequestBody InventoryRequest request) {
        inventoryService.releaseStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/deduct")
    public ResponseEntity<Void> deductStock(@Valid @RequestBody InventoryRequest request) {
        inventoryService.deductStock(request);
        return ResponseEntity.ok().build();
    }
}