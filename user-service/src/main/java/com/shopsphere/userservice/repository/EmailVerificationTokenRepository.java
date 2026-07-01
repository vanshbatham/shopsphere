package com.shopsphere.userservice.repository;

import com.shopsphere.userservice.entity.EmailVerificationToken;
import com.shopsphere.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, String> {
    void deleteByUser(User user);

    Optional<EmailVerificationToken> findByToken(String token);
}