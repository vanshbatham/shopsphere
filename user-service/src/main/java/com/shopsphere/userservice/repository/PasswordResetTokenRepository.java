package com.shopsphere.userservice.repository;

import com.shopsphere.userservice.entity.PasswordResetToken;
import com.shopsphere.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUser(User user);
}