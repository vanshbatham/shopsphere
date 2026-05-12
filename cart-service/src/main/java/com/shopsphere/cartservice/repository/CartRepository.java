package com.shopsphere.cartservice.repository;

import com.shopsphere.cartservice.entity.Cart;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartRepository extends CrudRepository<Cart, String> {
}