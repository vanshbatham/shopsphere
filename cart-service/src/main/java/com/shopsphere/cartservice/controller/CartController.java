package com.shopsphere.cartservice.controller;

import com.shopsphere.cartservice.dto.request.CartItemRequest;
import com.shopsphere.cartservice.entity.Cart;
import com.shopsphere.cartservice.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/carts")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<Cart> getCart(@RequestHeader("X-User-Id") String userId) {
        return new ResponseEntity<>(cartService.getCart(userId), HttpStatus.OK);
    }

    @PostMapping("/add")
    public ResponseEntity<Cart> addToCart(@RequestHeader("X-User-Id") String userId,
                                          @Valid @RequestBody CartItemRequest request) {
        return new ResponseEntity<>(cartService.addToCart(userId, request), HttpStatus.OK);
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(@RequestHeader("X-User-Id") String userId) {
        cartService.clearCart(userId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}