package com.shopsphere.reviewservice.repository;

import com.shopsphere.reviewservice.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByProductIdOrderByCreatedAtDesc(String productId);

    boolean existsByProductIdAndUserId(String productId, String userId);
}