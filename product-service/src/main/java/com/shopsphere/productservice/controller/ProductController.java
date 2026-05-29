package com.shopsphere.productservice.controller;


import com.shopsphere.productservice.dto.request.ProductRequest;
import com.shopsphere.productservice.dto.response.ProductResponse;
import com.shopsphere.productservice.entity.Category;
import com.shopsphere.productservice.entity.Product;
import com.shopsphere.productservice.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Product Management", description = "Endpoints for managing product catalog, categories, and inventory checks")
public class ProductController {

    private final ProductService productService;

    // PUBLIC ENDPOINT
    @Operation(summary = "Get all products", description = "Retrieves a list of all products available in the marketplace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Products retrieved successfully")

    })
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return new ResponseEntity<>(productService.getAllProducts(), HttpStatus.OK);
    }

    @Operation(summary = "Create a new category", description = "Creates a new product category. Only users with ADMIN role can access this endpoint.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Category created successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have the required role")
    })
    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestHeader(value = "X-User-Role", required = false) String role,
                                                   @RequestParam String name,
                                                   @RequestParam String description) {

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return new ResponseEntity<>(productService.createCategory(name, description), HttpStatus.CREATED);
    }

    @Operation(summary = "Get all categories", description = "Retrieves a list of all product categories available in the marketplace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categories retrieved successfully")
    })
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    @Operation(summary = "Create a new product", description = "Creates a new product under the specified category. Only users with ADMIN or SELLER role can access this endpoint.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Product created successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have the required role"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PostMapping("/category/{categoryId}")
    public ResponseEntity<ProductResponse> createProduct(@RequestHeader(value = "X-User-Role", required = false) String role,
                                                         @PathVariable String categoryId,
                                                         @Valid @RequestBody ProductRequest productRequest) {

        if (!"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return new ResponseEntity<>(productService.createProduct(productRequest, categoryId), HttpStatus.CREATED);
    }

    @Operation(summary = "Get products by category", description = "Retrieves a paginated list of products belonging to the specified category.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Products retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Category not found")
    })
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ProductResponse>> getProductsByCategory(
            @PathVariable String categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(productService.getProductsByCategory(categoryId, page, size));
    }

    @Operation(summary = "Get product by ID", description = "Retrieves the details of a product based on its unique identifier.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable String productId) {
        return ResponseEntity.ok(productService.getProductById(productId));
    }

    @Operation(summary = "Check if product exists by SKU code", description = "Checks if a product with the specified SKU code exists in the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Existence check completed successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @GetMapping("/exists/{skuCode}")
    public ResponseEntity<Boolean> checkProductExists(@PathVariable String skuCode) {
        return ResponseEntity.ok(productService.existsBySkuCode(skuCode));
    }

    @Operation(summary = "Get product by SKU code", description = "Retrieves the details of a product based on its SKU code.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @GetMapping("/sku/{skuCode}")
    public ResponseEntity<ProductResponse> getProductBySkuCode(@PathVariable String skuCode) {
        return ResponseEntity.ok(productService.getProductBySkuCode(skuCode));
    }

    @Operation(summary = "Search products", description = "Searches for products based on a keyword that matches the product name, description, or category.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search completed successfully")
    })
    @GetMapping("/search")
    public ResponseEntity<Page<Product>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Page<Product> results = productService.searchProducts(keyword, page, size);
        return ResponseEntity.ok(results);
    }

}