package com.shopsphere.productservice.controller;


import com.shopsphere.productservice.dto.request.ProductRequest;
import com.shopsphere.productservice.dto.response.ProductResponse;
import com.shopsphere.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // PUBLIC ENDPOINT
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return new ResponseEntity<>(productService.getAllProducts(), HttpStatus.OK);
    }

    // SECURED ENDPOINT (Admin Only)
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody ProductRequest request) {

        // Manual RBAC check relying on Gateway trust
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return new ResponseEntity<>(productService.createProduct(request), HttpStatus.CREATED);
    }
}