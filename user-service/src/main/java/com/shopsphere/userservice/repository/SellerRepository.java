package com.shopsphere.userservice.repository;

import com.shopsphere.userservice.entity.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SellerRepository extends JpaRepository<SellerProfile, UUID> {
    boolean existsByShopName(String shopName);
}
