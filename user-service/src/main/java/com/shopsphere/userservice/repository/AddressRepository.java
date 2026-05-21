package com.shopsphere.userservice.repository;

import com.shopsphere.userservice.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserId(String userId);

    Optional<Address> findByIdAndUserId(Long id, String userId);
}