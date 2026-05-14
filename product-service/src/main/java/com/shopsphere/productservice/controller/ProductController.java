package com.shopsphere.productservice.controller;


import com.shopsphere.productservice.dto.request.ProductRequest;
import com.shopsphere.productservice.dto.response.ProductResponse;
import com.shopsphere.productservice.entity.Category;
import com.shopsphere.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestHeader(value = "X-User-Role", required = false) String role,
                                                   @RequestParam String name,
                                                   @RequestParam String description) {

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return new ResponseEntity<>(productService.createCategory(name, description), HttpStatus.CREATED);
    }

    @PostMapping("/category/{categoryId}")
    public ResponseEntity<ProductResponse> createProduct(@RequestHeader(value = "X-User-Role", required = false) String role,
                                                         @PathVariable String categoryId,
                                                         @Valid @RequestBody ProductRequest productRequest) {

        if (!"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return new ResponseEntity<>(productService.createProduct(productRequest, categoryId), HttpStatus.CREATED);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ProductResponse>> getProductsByCategory(
            @PathVariable String categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(productService.getProductsByCategory(categoryId, page, size));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable String productId) {
        return ResponseEntity.ok(productService.getProductById(productId));
    }

    @GetMapping("/exists/{skuCode}")
    public ResponseEntity<Boolean> checkProductExists(@PathVariable String skuCode) {
        return ResponseEntity.ok(productService.existsBySkuCode(skuCode));
    }

}