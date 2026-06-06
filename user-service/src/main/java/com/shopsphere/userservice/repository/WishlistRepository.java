package com.shopsphere.userservice.repository;

import com.shopsphere.userservice.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, UUID> {
    List<WishlistItem> findByUserId(String userId);

    void deleteByUserIdAndSkuCode(String userId, String skuCode);

    boolean existsByUserIdAndSkuCode(String userId, String skuCode);
}