package com.otoki.uptention.domain.cart.repository;

import java.util.List;

import com.otoki.uptention.domain.cart.dto.CartItemDto;

public interface CartRepositoryCustom {
	List<CartItemDto> findCartItemsByUserId(Integer userId);
}
