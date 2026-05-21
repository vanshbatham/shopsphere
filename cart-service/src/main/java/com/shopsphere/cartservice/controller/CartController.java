package com.shopsphere.cartservice.controller;

import com.shopsphere.cartservice.dto.request.CartItemRequest;
import com.shopsphere.cartservice.entity.Cart;
import com.shopsphere.cartservice.service.CartService;
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
@RequestMapping("/api/v1/carts")
@RequiredArgsConstructor
@Tag(name = "Cart API", description = "APIs for managing shopping carts")
public class CartController {

    private final CartService cartService;

    @Operation(summary = "Get Cart", description = "Retrieve the current cart for the user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cart retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Cart not found")
    })
    @GetMapping
    public ResponseEntity<Cart> getCart(@RequestHeader("X-User-Id") String userId) {
        return new ResponseEntity<>(cartService.getCart(userId), HttpStatus.OK);
    }

    @Operation(summary = "Add to Cart", description = "Add an item to the user's cart")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Item added to cart successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data")
    })
    @PostMapping("/add")
    public ResponseEntity<Cart> addToCart(@RequestHeader("X-User-Id") String userId,
                                          @Valid @RequestBody CartItemRequest request) {
        return new ResponseEntity<>(cartService.addToCart(userId, request), HttpStatus.OK);
    }

    @Operation(summary = "Remove from Cart", description = "Remove an item from the user's cart")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Item removed from cart successfully"),
            @ApiResponse(responseCode = "404", description = "Item not found in cart")
    })
    @DeleteMapping
    public ResponseEntity<Void> clearCart(@RequestHeader("X-User-Id") String userId) {
        cartService.clearCart(userId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}