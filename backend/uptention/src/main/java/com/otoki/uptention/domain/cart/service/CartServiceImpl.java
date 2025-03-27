package com.otoki.uptention.domain.cart.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.domain.cart.entity.Cart;
import com.otoki.uptention.domain.cart.repository.CartRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

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
	public Cart getByCartId(Integer cartId) {
		return cartRepository.findById(cartId)
			.orElseThrow(() -> new CustomException(ErrorCode.CART_NOT_FOUND));
	}

	/**
	 * 해당 상품이 사용자의 장바구니에 담겨있는지 조회
	 */
	@Override
	public Cart getByUserAndItem(Integer userId, Integer itemId) {
		return cartRepository.findByUserIdAndItemId(userId, itemId);
	}

	/**
	 * 특정 사용자의 장바구니에 담긴 모든 상품 조회
	 */
	@Override
	public List<CartItemDto> getCartItemsByUserId(Integer userId) {
		return cartRepository.findCartItemsWithThumbnailByUserId(userId);
	}

	@Override
	public void removeByCartIds(List<Integer> cartIds) {
		cartRepository.deleteAllById(cartIds);
	}
}
