package com.shopsphere.reviewservice.service;

import com.shopsphere.reviewservice.dto.request.ReviewRequest;
import com.shopsphere.reviewservice.dto.response.ReviewResponse;
import com.shopsphere.reviewservice.entity.Review;
import com.shopsphere.reviewservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;

    @Transactional
    public ReviewResponse createReview(String userId, ReviewRequest request) {
        log.info("Processing incoming review submission from User: {} for Product: {}", userId, request.productId());

        if (reviewRepository.existsByProductIdAndUserId(request.productId(), userId)) {
            log.warn("Rejection triggered: User {} has already reviewed product {}", userId, request.productId());
            throw new IllegalStateException("Duplicate entry: You have already submitted a review for this product.");
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
    public List<ReviewResponse> getProductReviews(UUID productId) {
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