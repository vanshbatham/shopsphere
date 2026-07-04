package com.shopsphere.cartservice.entity;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {
    private String skuCode;
    private BigDecimal snapshotPrice;
    private Integer quantity;
}