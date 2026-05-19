package com.shopsphere.orderservice.controller;

import com.shopsphere.orderservice.dto.request.OrderRequest;
import com.shopsphere.orderservice.dto.response.OrderResponse;
import com.shopsphere.orderservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<String> placeOrder(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody OrderRequest orderRequest
    ) {
        // Pass the request body to your service so it can extract items and the PaymentMethod
        String response = orderService.placeOrder(userId, orderRequest);

        if (response.contains("Oops!")) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrdersForUser(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.getAllOrdersForUser(userId));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PutMapping("/{orderId}/pay")
    public ResponseEntity<String> confirmPayment(@PathVariable String orderId) {
        orderService.confirmOrderPayment(orderId);
        return ResponseEntity.ok("Order payment confirmed. Inventory deduction triggered.");
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<String> cancelOrder(@PathVariable String orderId) {
        orderService.cancelOrder(orderId);
        return ResponseEntity.ok("Order cancelled. Inventory release triggered.");
    }
}