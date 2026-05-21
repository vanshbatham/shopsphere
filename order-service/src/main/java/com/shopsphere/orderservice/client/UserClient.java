package com.shopsphere.orderservice.client;

import com.shopsphere.orderservice.dto.request.AddressDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/v1/users/addresses/{addressId}")
    AddressDto getAddressById(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable("addressId") Long addressId
    );
}