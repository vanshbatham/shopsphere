package com.shopsphere.reviewservice.controller;

import com.shopsphere.reviewservice.dto.request.ReviewRequest;
import com.shopsphere.reviewservice.dto.response.ReviewResponse;
import com.shopsphere.reviewservice.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Review Engine", description = "Operational management endpoints for submission and lookup of product reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Publish a new product review", description = "Saves an authenticated user rating and optional commentary.")
    public ResponseEntity<ReviewResponse> publishReview(@RequestHeader("X-User-Id") String userId,
                                                        @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(userId, request));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Retrieve reviews by Product ID", description = "Exposes a public unauthenticated array of all relevant ratings.")
    public ResponseEntity<List<ReviewResponse>> fetchReviewsByProduct(@PathVariable String productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }
}