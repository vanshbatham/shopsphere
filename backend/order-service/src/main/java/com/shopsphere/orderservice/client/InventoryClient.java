package com.shopsphere.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    record InventoryRequest(String skuCode, Integer quantity) {
    }

    @PostMapping("api/v1/inventory/reserve")
    Boolean reserveStock(@RequestBody InventoryRequest request);

    @PostMapping("api/v1/inventory/release")
    void releaseStock(@RequestBody InventoryRequest request);

}
