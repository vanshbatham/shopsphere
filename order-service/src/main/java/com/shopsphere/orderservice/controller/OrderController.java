package com.shopsphere.orderservice.controller;

import com.shopsphere.orderservice.dto.request.OrderRequest;
import com.shopsphere.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<String> placeOrder(
            @RequestBody OrderRequest orderRequest,
            @RequestHeader("X-User-Id") String userId) { // Trust the Gateway!

        String response = orderService.placeOrder(orderRequest, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}