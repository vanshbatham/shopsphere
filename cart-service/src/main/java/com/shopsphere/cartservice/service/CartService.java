package com.shopsphere.cartservice.service;

import com.shopsphere.cartservice.dto.request.CartItemRequest;
import com.shopsphere.cartservice.entity.Cart;
import com.shopsphere.cartservice.entity.CartItem;
import com.shopsphere.cartservice.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private static final Long CART_TTL_SECONDS = 259200L;

    public Cart getCart(String userId) {
        return cartRepository.findById(userId)
                .orElse(Cart.builder().id(userId).expirationInSeconds(CART_TTL_SECONDS).build());
    }

    public Cart addToCart(String userId, CartItemRequest request) {
        Cart cart = getCart(userId);

        // check if the item is already in the cart
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getSkuCode().equals(request.skuCode()))
                .findFirst();

        if (existingItem.isPresent()) {
            // If it exists, just increase the quantity
            existingItem.get().setQuantity(existingItem.get().getQuantity() + request.quantity());
            log.info("Increased quantity for SKU {} in cart for user {}", request.skuCode(), userId);
        } else {
            // otherwise, add the new item with its snapshot price
            cart.getItems().add(CartItem.builder()
                    .skuCode(request.skuCode())
                    .snapshotPrice(request.snapshotPrice())
                    .quantity(request.quantity())
                    .build());
            log.info("Added new SKU {} to cart for user {}", request.skuCode(), userId);
        }

        // Reset the 3-day expiration timer every time they interact with the cart!
        cart.setExpirationInSeconds(CART_TTL_SECONDS);
        return cartRepository.save(cart);
    }

    public void clearCart(String userId) {
        cartRepository.deleteById(userId);
        log.info("Cleared cart for user {}", userId);
    }
}