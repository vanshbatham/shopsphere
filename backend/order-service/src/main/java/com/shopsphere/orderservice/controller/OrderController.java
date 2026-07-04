package com.shopsphere.orderservice.controller;

import com.shopsphere.orderservice.dto.request.DirectOrderRequest;
import com.shopsphere.orderservice.dto.request.OrderRequest;
import com.shopsphere.orderservice.dto.response.OrderResponse;
import com.shopsphere.orderservice.dto.response.SkuSummaryResponse;
import com.shopsphere.orderservice.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Management", description = "Endpoints for orchestrating the e-commerce checkout and order lifecycle")
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Place a new order", description = "Initiates the distributed checkout saga, reserves inventory, and routes COD vs Digital payment methods.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Order placed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body or missing payment method"),
            @ApiResponse(responseCode = "503", description = "Inventory or Cart service is currently unavailable (Circuit Breaker fallback)")
    })
    @PostMapping
    public ResponseEntity<Map<String, String>> placeOrder(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody OrderRequest orderRequest
    ) {
        String result = orderService.placeOrder(userId, orderRequest);
        if (result.startsWith("Oops!")) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", result));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "orderId", result,
                        "message", "Order placed successfully"
                ));
    }

    @Operation(summary = "Get user's order history", description = "Fetches all past and current orders for the authenticated user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid user ID header")
    })
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrdersForUser(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(orderService.getAllOrdersForUser(userId));
    }

    @Operation(summary = "Get specific order details", description = "Fetches the full line items, total price, and dual-state status of a specific order.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order details retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid user ID header"),
            @ApiResponse(responseCode = "404", description = "Order not found or does not belong to the user")
    })
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @Operation(summary = "Get all system orders (Admin Only)", description = "Fetches every order in the platform. Requires ADMIN role header.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have the required role")
    })
    @GetMapping("/all")
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @Operation(summary = "Simulate Payment Success (Webhook)", description = "Manually triggers the Payment Success saga, updating the order to PROCESSING and definitively deducting inventory via Kafka.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order payment confirmed and inventory deduction triggered"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    @PutMapping("/{orderId}/pay")
    public ResponseEntity<String> confirmPayment(@PathVariable String orderId) {
        orderService.confirmOrderPayment(orderId);
        return ResponseEntity.ok("Order payment confirmed. Inventory deduction triggered.");
    }

    @Operation(summary = "Simulate Order Cancellation", description = "Manually triggers the Order Cancellation saga, updating the status to CANCELLED and releasing reserved inventory back to available stock via Kafka.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order cancelled and inventory release triggered"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<String> cancelOrder(@PathVariable String orderId) {
        orderService.cancelOrder(orderId);
        return ResponseEntity.ok("Order cancelled. Inventory release triggered.");
    }

    @Operation(summary = "Internal Verification: Verify user purchase", description = "Checks if the user has a finalized historical record purchasing this product.")
    @GetMapping("/internal/verify-purchase")
    public ResponseEntity<Boolean> verifyUserPurchase(@RequestParam("userId") String userId,
                                                      @RequestParam("productId") String productId) {
        boolean hasPurchased = orderService.checkPurchaseHistory(userId, productId);
        return ResponseEntity.ok(hasPurchased);
    }

    @Operation(summary = "Place Direct Order", description = "Allows placing an order directly, bypassing the cart.")
    @PostMapping("/direct")
    public ResponseEntity<Map<String, String>> placeDirectOrder(@RequestHeader("X-User-Id") String userId,
                                                                @RequestBody DirectOrderRequest request) {

        String result = orderService.placeDirectOrder(userId, request);

        if (result.startsWith("Oops!")) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", result));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "orderId", result,
                        "message", "Order placed successfully"
                ));
    }

    @Operation(summary = "Update order status (Admin Only)", description = "Transitions an order to SHIPPED or DELIVERED. Requires ADMIN role header. Sends a notification email to the buyer.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid status transition for the order's current state"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have the required role"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    @PutMapping("/{orderId}/status")
    public ResponseEntity<String> updateOrderStatus(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable String orderId,
            @RequestParam com.shopsphere.orderservice.enums.OrderStatus status) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok("Order status updated to " + status);
    }

    @Operation(summary = "Get seller earnings summary", description = "Aggregates quantity sold and revenue per SKU for COMPLETED-payment orders only, scoped to the SKUs passed in. Used by the seller dashboard's earnings page.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Summary retrieved successfully")
    })
    @GetMapping("/seller-summary")
    public ResponseEntity<List<SkuSummaryResponse>> getSellerSummary(
            @RequestParam("skuCodes") List<String> skuCodes) {
        return ResponseEntity.ok(orderService.getSellerSummary(skuCodes));
    }
}