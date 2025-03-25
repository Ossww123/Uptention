package com.otoki.uptention.domain.cart.service;

import com.otoki.uptention.domain.cart.entity.Cart;

public interface CartService {
	Cart saveCart(Cart cart);
	Cart getByUserAndItem(Integer userId, Integer itemId);
}
