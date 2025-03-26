package com.otoki.uptention.domain.cart.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.domain.cart.entity.Cart;
import com.otoki.uptention.domain.cart.repository.CartRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

	private final CartRepository cartRepository;

	@Override
	public Cart saveCart(Cart cart) {
		return cartRepository.save(cart);
	}

	@Override
	public Cart getByUserAndItem(Integer userId, Integer itemId) {
		return cartRepository.findByUserIdAndItemId(userId, itemId);
	}

	@Override
	public List<CartItemDto> getCartItemsByUserId(Integer userId) {
		return cartRepository.findCartItemsByUserId(userId);
	}
}
