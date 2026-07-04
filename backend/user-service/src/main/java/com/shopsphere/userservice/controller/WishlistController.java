package com.shopsphere.userservice.controller;

import com.shopsphere.userservice.dto.request.WishlistRequest;
import com.shopsphere.userservice.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<String>> getWishlist(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(wishlistService.getWishlistSkuCodes(userId));
    }

    @PostMapping("/toggle")
    public ResponseEntity<Void> toggleWishlist(@RequestHeader("X-User-Id") String userId,
                                               @RequestBody WishlistRequest request) {
        wishlistService.toggleWishlist(userId, request.skuCode());
        return ResponseEntity.ok().build();
    }
}