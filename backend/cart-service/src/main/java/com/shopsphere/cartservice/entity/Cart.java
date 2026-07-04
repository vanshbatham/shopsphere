package com.shopsphere.cartservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.util.ArrayList;
import java.util.List;

@RedisHash("Cart") // tells Spring to store this in Redis under the "Cart" namespace
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {

    @Id // the unique Redis key (this will be the User's UUID)
    private String id;

    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    @TimeToLive
    private Long expirationInSeconds;
}