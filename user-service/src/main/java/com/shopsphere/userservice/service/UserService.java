package com.shopsphere.userservice.service;

import com.shopsphere.userservice.dto.request.LoginRequest;
import com.shopsphere.userservice.dto.request.UserRegistrationRequest;
import com.shopsphere.userservice.dto.request.UserUpdateRequest;
import com.shopsphere.userservice.dto.response.AuthResponse;
import com.shopsphere.userservice.dto.response.UserResponse;
import com.shopsphere.userservice.entity.Role;
import com.shopsphere.userservice.entity.User;
import com.shopsphere.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse registerUser(UserRegistrationRequest request) {
        return createUserWithRole(request, Role.BUYER);
    }

    @Transactional
    public UserResponse registerAdmin(UserRegistrationRequest request) {
        return createUserWithRole(request, Role.ADMIN);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        String token = jwtService.generateToken(user);
        log.info("User {} logged in successfully", user.getEmail());

        return new AuthResponse(token, "Bearer", 900000L);
    }

    @Transactional
    public String upgradeToSeller(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() == Role.SELLER || user.getRole() == Role.ADMIN) {
            throw new IllegalStateException("User already possesses elevated privileges.");
        }

        user.setRole(Role.SELLER);
        userRepository.save(user);

        log.info("User {} upgraded to SELLER role", userId);

        // The user will need to log in again to get a fresh JWT with the new role!
        return "Successfully upgraded to SELLER. Please log in again to refresh your permissions.";
    }

    @Transactional(readOnly = true)
    public UserResponse getUserProfile(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.firstName() != null && !request.firstName().trim().isEmpty()) {
            user.setFirstName(request.firstName());
        }

        if (request.lastName() != null && !request.lastName().trim().isEmpty()) {
            user.setLastName(request.lastName());
        }

        if (request.phoneNumber() != null && !request.phoneNumber().trim().isEmpty()) {
            user.setPhoneNumber(request.phoneNumber());
        }

        if (request.email() != null && !request.email().trim().isEmpty()) {
            if (userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("Email is already registered");
            }
            user.setEmail(request.email());
        }

        User updatedUser = userRepository.save(user);
        log.info("User {} successfully updated their profile details", userId);

        return mapToUserResponse(updatedUser);
    }

    private UserResponse createUserWithRole(UserRegistrationRequest request, Role role) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phoneNumber(request.phoneNumber())
                .role(role)
                .isActive(true)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("{} registered successfully with ID: {}", role, savedUser.getId());

        return mapToUserResponse(savedUser);
    }

    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isActive(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }
}