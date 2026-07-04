package com.shopsphere.cartservice.client;

import com.shopsphere.cartservice.dto.response.ProductResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-service")
public interface ProductClient {
    @GetMapping("/api/v1/products/sku/{skuCode}")
    ProductResponse getProductBySkuCode(@PathVariable("skuCode") String skuCode);
}
