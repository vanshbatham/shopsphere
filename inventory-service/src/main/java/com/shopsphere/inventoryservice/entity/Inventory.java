package com.shopsphere.inventoryservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // the SKU (Stock Keeping Unit) is the unique identifier
    @Column(unique = true, nullable = false)
    private String skuCode;

    // how many we physically have sitting on the shelf ready to buy
    @Column(nullable = false)
    private Integer availableQuantity;

    // how many are currently sitting in people's checkout carts waiting for payment
    @Column(nullable = false)
    private Integer reservedQuantity;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}