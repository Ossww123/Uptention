package com.otoki.uptention.application.cart.service;

import java.util.List;

import com.otoki.uptention.application.cart.dto.request.CartQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.domain.cart.entity.Cart;

public interface CartAppService {
	Cart addToCart(ItemQuantityRequestDto itemQuantityRequestDto);

	List<CartItemDto> getUserCartItems();

	Cart updateCartItemQuantity(Integer cartId, CartQuantityRequestDto cartQuantityRequestDto);

	void removeCartItem(List<Integer> cartId);
}
