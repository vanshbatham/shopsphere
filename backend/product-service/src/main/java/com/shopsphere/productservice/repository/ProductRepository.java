package com.shopsphere.productservice.repository;

import com.shopsphere.productservice.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Page<Product> findByCategoryId(String categoryId, Pageable pageable);

    boolean existsBySkuCode(String skuCode);

    Optional<Product> findBySkuCode(String skuCode);

    Page<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCategoryNameContainingIgnoreCase(
            String name, String description, String categoryName, Pageable pageable
    );

    List<Product> findBySellerId(String sellerId);
}