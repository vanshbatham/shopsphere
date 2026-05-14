package com.shopsphere.cartservice.service;

import com.shopsphere.cartservice.client.ProductClient;
import com.shopsphere.cartservice.dto.request.CartItemRequest;
import com.shopsphere.cartservice.dto.response.ProductResponse;
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
    private final ProductClient productClient;

    public Cart getCart(String userId) {
        return cartRepository.findById(userId)
                .orElse(Cart.builder().id(userId).expirationInSeconds(CART_TTL_SECONDS).build());
    }

    public Cart addToCart(String userId, CartItemRequest request) {

        // fetch the real product data
        // If the SKU doesn't exist, Feign throws a 404 and stops the exploit immediately.
        ProductResponse product = productClient.getProductBySkuCode(request.skuCode());

        Cart cart = getCart(userId);

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getSkuCode().equals(request.skuCode()))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity() + request.quantity());
            // update the snapshot price to the latest price if they add more!
            existingItem.get().setSnapshotPrice(product.price());
        } else {
            cart.getItems().add(CartItem.builder()
                    .skuCode(request.skuCode())
                    .snapshotPrice(product.price())
                    .quantity(request.quantity())
                    .build());
        }

        cart.setExpirationInSeconds(CART_TTL_SECONDS);
        return cartRepository.save(cart);
    }

    public void clearCart(String userId) {
        cartRepository.deleteById(userId);
        log.info("Cleared cart for user {}", userId);
    }
}