package com.shopsphere.userservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.userservice.dto.request.*;
import com.shopsphere.userservice.dto.response.AuthResponse;
import com.shopsphere.userservice.dto.response.UserResponse;
import com.shopsphere.userservice.entity.PasswordResetToken;
import com.shopsphere.userservice.entity.Role;
import com.shopsphere.userservice.entity.User;
import com.shopsphere.userservice.exception.BadRequestException;
import com.shopsphere.userservice.exception.DuplicateResourceException;
import com.shopsphere.userservice.exception.ResourceNotFoundException;
import com.shopsphere.userservice.repository.PasswordResetTokenRepository;
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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

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

        String token = jwtService.generateToken(user);
        log.info("User {} logged in successfully", user.getEmail());

        return new AuthResponse(token, "Bearer", 900000L);
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

        // The user will need to log in again to get a fresh JWT with the new role!
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
            if (userRepository.existsByEmail(request.email())) {
                throw new DuplicateResourceException("Email is already registered");
            }
            user.setEmail(request.email());
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

    @Transactional
    public void initiatePasswordReset(String email) {
        // find the user. If they don't exist, silently exit
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            log.warn("Password reset requested for non-existent email: {}", email);
            return;
        }

        User user = userOptional.get();

        // wipe any existing tokens for this user so they only have one active code
        tokenRepository.deleteByUser(user);
        tokenRepository.flush();

        // generate a secure 6-digit OTP
        SecureRandom random = new SecureRandom();
        String otp = String.format("%06d", random.nextInt(999999));

        // save to Database (Expires in 15 minutes)
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        tokenRepository.save(resetToken);

        // fire Kafka Event
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
        // find the token in the db
        PasswordResetToken resetToken = tokenRepository.findByToken(request.token())
                .orElseThrow(() -> new AccessDeniedException("Invalid or expired token"));

        // security check: does the token actually belong to the email provided?
        if (!resetToken.getUser().getEmail().equalsIgnoreCase(request.email())) {
            throw new AccessDeniedException("Invalid or expired token");
        }

        // expiration Check: is it past the 15-minute window?
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken); // Clean up the dead token
            throw new AccessDeniedException("Token has expired. Please request a new one.");
        }

        // update the User's Password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // invalidate the Token (Single-Use Rule)
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