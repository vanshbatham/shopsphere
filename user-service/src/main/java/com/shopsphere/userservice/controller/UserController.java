package com.shopsphere.userservice.controller;


import com.shopsphere.userservice.dto.request.LoginRequest;
import com.shopsphere.userservice.dto.request.UserRegistrationRequest;
import com.shopsphere.userservice.dto.response.AuthResponse;
import com.shopsphere.userservice.dto.response.UserResponse;
import com.shopsphere.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegistrationRequest request) {
        UserResponse response = userService.registerUser(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.login(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // NOTE: This will be heavily secured with JWT in the next block.
    // Only an authenticated BUYER can hit this.
    @PostMapping("/become-seller")
    public ResponseEntity<String> becomeSeller(@RequestHeader("X-User-Id") String userId,
                                               @RequestHeader("X-User-Role") String role) {

        // This proves the Gateway successfully intercepted, validated, and mutated the request!
        String responseMessage = String.format("Success! Gateway says you are User ID: %s with Role: %s. Seller onboarding flow to be implemented.", userId, role);

        return ResponseEntity.status(HttpStatus.OK).body(responseMessage);
    }

    // NOTE: This will be restricted strictly to users who ALREADY have the ADMIN role.
    @PostMapping("/admin/create")
    public ResponseEntity<String> createAdmin() {
        // Future logic: Allow an existing admin to provision a new admin account
        return ResponseEntity.status(HttpStatus.CREATED).body("Admin creation flow to be implemented");
    }
}