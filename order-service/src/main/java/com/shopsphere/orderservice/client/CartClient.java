package com.shopsphere.orderservice.client;

import com.shopsphere.orderservice.dto.request.CartDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "cart-service")
public interface CartClient {

    // passing the X-User-Id header manually through Feign!
    @GetMapping("/api/v1/carts")
    CartDto getCart(@RequestHeader("X-User-Id") String userId);

    @DeleteMapping("/api/v1/carts")
    void clearCart(@RequestHeader("X-User-Id") String userId);
}