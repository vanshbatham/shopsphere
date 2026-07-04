package com.shopsphere.userservice.service;

import com.shopsphere.userservice.entity.WishlistItem;
import com.shopsphere.userservice.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    @Transactional(readOnly = true)
    public List<String> getWishlistSkuCodes(String userId) {
        return wishlistRepository.findByUserId(userId).stream()
                .map(WishlistItem::getSkuCode)
                .toList();
    }

    @Transactional
    public void toggleWishlist(String userId, String skuCode) {
        if (wishlistRepository.existsByUserIdAndSkuCode(userId, skuCode)) {
            wishlistRepository.deleteByUserIdAndSkuCode(userId, skuCode);
        } else {
            wishlistRepository.save(WishlistItem.builder()
                    .userId(userId)
                    .skuCode(skuCode)
                    .build());
        }
    }
}