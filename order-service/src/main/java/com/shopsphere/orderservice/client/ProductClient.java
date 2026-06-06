package com.shopsphere.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;

@FeignClient(name = "product-service")
public interface ProductClient {

    @GetMapping("/api/v1/products/sku/{skuCode}/price")
    BigDecimal getProductPrice(@PathVariable("skuCode") String skuCode);
}