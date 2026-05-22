package com.shopsphere.reviewservice.service;

import com.shopsphere.reviewservice.client.OrderClient;
import com.shopsphere.reviewservice.dto.request.ReviewRequest;
import com.shopsphere.reviewservice.dto.response.ReviewResponse;
import com.shopsphere.reviewservice.entity.Review;
import com.shopsphere.reviewservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderClient orderClient;

    @Transactional
    public ReviewResponse createReview(String userId, ReviewRequest request) {
        log.info("Initiating verification for review from User: {} on Product: {}", userId, request.productId());

        // 1. DUPLICATE CHECK
        if (reviewRepository.existsByProductIdAndUserId(request.productId(), userId)) {
            throw new IllegalStateException("Duplicate entry: You have already submitted a review for this product.");
        }

        // 2. SYNCHRONOUS VERIFIED BUYER CHECK
        Boolean isVerifiedBuyer;
        try {
            isVerifiedBuyer = orderClient.verifyUserPurchase(userId, request.productId());
        } catch (Exception e) {
            log.error("Network communication failure to order-service via Feign Client", e);
            throw new IllegalStateException("Verification temporary unavailable. Please try again later.");
        }

        if (Boolean.FALSE.equals(isVerifiedBuyer)) {
            log.warn("Security Alert: User {} attempted to review unpurchased product {}", userId, request.productId());
            throw new SecurityException("Access Denied: You can only review products you have officially purchased.");
        }

        Review review = Review.builder()
                .productId(request.productId())
                .userId(userId)
                .rating(request.rating())
                .comment(request.comment())
                .build();

        Review savedEntity = reviewRepository.save(review);
        return mapToResponse(savedEntity);
    }


    @Transactional(readOnly = true)
    public List<ReviewResponse> getProductReviews(String productId) {
        log.info("Fetching all consolidated reviews for Product: {}", productId);
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private ReviewResponse mapToResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getProductId(),
                review.getUserId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}