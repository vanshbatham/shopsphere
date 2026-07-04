package com.shopsphere.userservice.repository;

import com.shopsphere.userservice.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {
    List<Address> findByUserId(String userId);

    Optional<Address> findByIdAndUserId(UUID id, String userId);
}