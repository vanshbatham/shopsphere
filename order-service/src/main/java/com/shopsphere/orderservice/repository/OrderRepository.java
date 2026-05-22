package com.shopsphere.orderservice.repository;

import com.shopsphere.orderservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByUserId(String userId);

    @Query(""" 
            SELECT COUNT(o) > 0 FROM Order o\s
            JOIN o.orderLineItems item\s
            WHERE o.userId = :userId\s
            AND item.skuCode = :skuCode\s
            AND o.orderStatus = 'DELIVERED'\s
            AND o.paymentStatus = 'COMPLETED'\s""")
    boolean existsVerifiedPurchase(@Param("userId") String userId, @Param("skuCode") String skuCode);
}

