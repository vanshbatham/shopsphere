package com.shopsphere.userservice.controller;

import com.shopsphere.userservice.dto.request.LoginRequest;
import com.shopsphere.userservice.dto.request.PasswordResetRequest;
import com.shopsphere.userservice.dto.request.UserRegistrationRequest;
import com.shopsphere.userservice.dto.request.UserUpdateRequest;
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
        return new ResponseEntity<>(userService.registerUser(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return new ResponseEntity<>(userService.login(request), HttpStatus.OK);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    @PostMapping("/become-seller")
    public ResponseEntity<String> becomeSeller(@RequestHeader("X-User-Id") String userId) {
        String responseMessage = userService.upgradeToSeller(userId);
        return ResponseEntity.status(HttpStatus.OK).body(responseMessage);
    }

    @PostMapping("/admin/create")
    public ResponseEntity<UserResponse> createAdmin(@RequestHeader("X-User-Role") String role,
                                                    @Valid @RequestBody UserRegistrationRequest request) {

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerAdmin(request));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@RequestHeader("X-User-Id") String userId,
                                                      @RequestBody UserUpdateRequest request) {

        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getUserById(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam String email) {
        userService.initiatePasswordReset(email);
        return ResponseEntity.ok("If an account exists with that email, a password reset code has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok("Password has been successfully reset. You can now log in.");
    }
}