package com.otoki.uptention.domain.cart.service;

import java.util.List;

import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.domain.cart.entity.Cart;

public interface CartService {
	Cart saveCart(Cart cart);

	Cart getByCartId(Integer cartId);

	Cart getByUserAndItem(Integer userId, Integer itemId);

	List<CartItemDto> getCartItemsByUserId(Integer userId);

	void removeByCartIds(List<Integer> cartIds);

	Integer countCartItemsByUserId(Integer userId);

}
