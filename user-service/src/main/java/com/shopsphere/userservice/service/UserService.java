package com.shopsphere.userservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.userservice.dto.EmailVerificationRequestedEvent;
import com.shopsphere.userservice.dto.request.*;
import com.shopsphere.userservice.dto.response.AuthResponse;
import com.shopsphere.userservice.dto.response.UserResponse;
import com.shopsphere.userservice.entity.*;
import com.shopsphere.userservice.exception.BadRequestException;
import com.shopsphere.userservice.exception.DuplicateResourceException;
import com.shopsphere.userservice.exception.ResourceNotFoundException;
import com.shopsphere.userservice.repository.EmailVerificationTokenRepository;
import com.shopsphere.userservice.repository.PasswordResetTokenRepository;
import com.shopsphere.userservice.repository.SellerRepository;
import com.shopsphere.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final SellerRepository sellerRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Transactional
    public UserResponse registerUser(UserRegistrationRequest request) {
        log.info("Registering user. email={}", request.email());

        if (userRepository.existsByEmail(request.email())) {
            log.warn("Registration failed - email already exists. email={}", request.email());
            throw new DuplicateResourceException("Email already registered");
        }

        log.info("Registering user. username={}, email={}", request.username(), request.email());
        return createUserWithRole(request, Role.BUYER);
    }

    @Transactional
    public UserResponse registerAdmin(UserRegistrationRequest request) {
        log.info("Registering admin. email={}", request.email());

        if (userRepository.existsByEmail(request.email())) {
            log.warn("Admin registration failed - email already exists. email={}", request.email());
            throw new DuplicateResourceException("Email already registered");
        }
        return createUserWithRole(request, Role.ADMIN);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        log.info("User {} logged in successfully", user.getEmail());

        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                900000L // 15 minutes
        );
    }

    // --- Refresh token  ---
    public AuthResponse refreshAccessToken(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        String userEmail = jwtService.extractUsername(refreshToken);

        if (userEmail == null) {
            throw new AccessDeniedException("Invalid refresh token");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new AccessDeniedException("Refresh token is expired or invalid");
        }

        String newAccessToken = jwtService.generateToken(user);
        log.info("Access token refreshed successfully for user: {}", userEmail);

        return new AuthResponse(
                newAccessToken,
                refreshToken,
                "Bearer",
                900000L // 15 minutes
        );
    }

    @Transactional
    public String upgradeToSeller(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SELLER || user.getRole() == Role.ADMIN) {
            throw new BadRequestException("User already possesses elevated privileges.");
        }

        user.setRole(Role.SELLER);
        userRepository.save(user);

        log.info("User {} upgraded to SELLER role", userId);

        return "Successfully upgraded to SELLER. Please log in again to refresh your permissions.";
    }

    @Transactional(readOnly = true)
    public UserResponse getUserProfile(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

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
            String incomingEmail = request.email().trim();

            if (!user.getEmail().equalsIgnoreCase(incomingEmail)) {

                if (userRepository.existsByEmail(incomingEmail)) {
                    throw new DuplicateResourceException("Email is already registered");
                }
                user.setEmail(incomingEmail);
            }
        }

        User updatedUser = userRepository.save(user);
        log.info("User {} successfully updated their profile details", userId);

        return mapToUserResponse(updatedUser);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByIds(List<String> userIds) {
        List<UUID> uuids = userIds.stream()
                .map(id -> {
                    try {
                        return UUID.fromString(id);
                    } catch (IllegalArgumentException e) {
                        log.warn("Skipping invalid user id in bulk lookup: {}", id);
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .toList();

        return userRepository.findAllById(uuids).stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void initiateEmailVerification(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        emailVerificationTokenRepository.deleteByUser(user);
        emailVerificationTokenRepository.flush();

        SecureRandom random = new SecureRandom();
        String otp = String.format("%06d", random.nextInt(999999));

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .token(otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        emailVerificationTokenRepository.save(verificationToken);

        try {
            EmailVerificationRequestedEvent event =
                    new EmailVerificationRequestedEvent(user.getEmail(), user.getFirstName(), otp);
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonMessage = objectMapper.writeValueAsString(event);

            kafkaTemplate.send("email-verification-topic", jsonMessage);
            log.info("Email verification OTP generated and sent to Kafka for user: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to publish email verification event to Kafka", e);
            throw new RuntimeException("Could not send verification email");
        }
    }

    @Transactional
    public void confirmEmailVerification(String userId, String otp) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(otp)
                .orElseThrow(() -> new AccessDeniedException("Invalid or expired verification code"));

        if (!verificationToken.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Invalid or expired verification code");
        }

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            emailVerificationTokenRepository.delete(verificationToken);
            throw new AccessDeniedException("Verification code has expired. Please request a new one.");
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        emailVerificationTokenRepository.delete(verificationToken);
        log.info("Email successfully verified for user: {}", user.getEmail());
    }

    @Transactional
    public void initiatePasswordReset(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            log.warn("Password reset requested for non-existent email: {}", email);
            return;
        }

        User user = userOptional.get();

        tokenRepository.deleteByUser(user);
        tokenRepository.flush();

        SecureRandom random = new SecureRandom();
        String otp = String.format("%06d", random.nextInt(999999));

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        tokenRepository.save(resetToken);

        try {
            PasswordResetRequestedEvent event = new PasswordResetRequestedEvent(user.getEmail(), user.getFirstName(), otp);
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonMessage = objectMapper.writeValueAsString(event);

            kafkaTemplate.send("password-reset-topic", jsonMessage);
            log.info("Password reset OTP generated and sent to Kafka for user: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to publish password reset event to Kafka", e);
            throw new RuntimeException("Could not process password reset request");
        }
    }

    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        PasswordResetToken resetToken = tokenRepository.findByToken(request.token())
                .orElseThrow(() -> new AccessDeniedException("Invalid or expired token"));

        if (!resetToken.getUser().getEmail().equalsIgnoreCase(request.email())) {
            throw new AccessDeniedException("Invalid or expired token");
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            throw new AccessDeniedException("Token has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        tokenRepository.delete(resetToken);
        log.info("Password successfully reset for user: {}", user.getEmail());
    }

    private UserResponse createUserWithRole(UserRegistrationRequest request, Role role) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email is already registered");
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

    @Transactional
    public void becomeSeller(String userId, BecomeSellerRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Role.SELLER.equals(user.getRole())) {
            throw new BadRequestException("User is already a seller.");
        }

        if (sellerRepository.existsByShopName(request.shopName())) {
            throw new BadRequestException("Shop name is already in use. Please choose another.");
        }

        SellerProfile profile = SellerProfile.builder()
                .user(user)
                .shopName(request.shopName())
                .shopDescription(request.shopDescription())
                .build();

        user.setSellerProfile(profile);
        user.setRole(Role.SELLER);

        userRepository.save(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getRole(),
                user.isActive(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }
}