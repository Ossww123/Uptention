package com.otoki.uptention.application.cart.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.cart.dto.request.CartQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.domain.cart.entity.Cart;
import com.otoki.uptention.domain.cart.service.CartService;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartAppServiceImpl implements CartAppService {

	private static final int MIN_QUANTITY = 1;
	private static final int MAX_QUANTITY = 99;

	private final CartService cartService;
	private final ItemService itemService;
	private final UserService userService;

	/**
	 * 장바구니에 상품 추가
	 * 수량은 1~99개 사이로 제한
	 */
	@Transactional
	@Override
	public Cart addToCart(ItemQuantityRequestDto itemQuantityRequestDto) {
		validateQuantity(itemQuantityRequestDto.getQuantity());

		// security 구현 후, 코드 수정 필요
		User user = userService.getUserById(1);
		Item item = itemService.getItemById(itemQuantityRequestDto.getItemId());

		// 기존 장바구니 항목 확인 및 처리
		Cart existingCart = cartService.getByUserAndItem(user.getId(), item.getId());
		if (existingCart != null) {
			return updateExistingCart(existingCart, itemQuantityRequestDto.getQuantity());
		}

		// 새 장바구니 항목 생성
		return createNewCart(user, item, itemQuantityRequestDto.getQuantity());
	}

	@Override
	public List<CartItemDto> getUserCartItems() {
		// security 구현 후, 코드 수정 필요
		User user = userService.getUserById(1);

		return cartService.getCartItemsByUserId(user.getId());
	}

	@Transactional
	@Override
	public Cart updateCartItemQuantity(Integer cartId, CartQuantityRequestDto cartQuantityRequestDto) {
		validateQuantity(cartQuantityRequestDto.getQuantity());

		Cart cart = cartService.getByCartId(cartId);

		cart.updateQuantity(cartQuantityRequestDto.getQuantity());
		return cartService.saveCart(cart);
	}

	@Transactional
	@Override
	public void removeCartItem(List<Integer> cartIds) {
		// 빈 배열 검증
		if (cartIds == null || cartIds.isEmpty()) {
			throw new CustomException(ErrorCode.CART_EMPTY_IDS);
		}

		cartService.removeByCartIds(cartIds);
	}

	/**
	 * 현재 로그인한 사용자의 장바구니에 담긴 상품 수량 합계를 조회합니다.
	 */
	@Override
	public int countCartItems() {
		User user = userService.getUserById(1);
		return cartService.countCartItemsByUserId(user.getId());
	}

	/**
	 * 상품 수량 유효성 검증
	 */
	private void validateQuantity(int quantity) {
		if (quantity < MIN_QUANTITY) {
			throw new CustomException(ErrorCode.ITEM_QUANTITY_MIN_REQUIRED);
		}

		if (quantity > MAX_QUANTITY) {
			throw new CustomException(ErrorCode.ITEM_QUANTITY_MAX_EXCEEDED);
		}
	}

	/**
	 * 기존 장바구니 항목 업데이트
	 */
	private Cart updateExistingCart(Cart existingCart, int additionalQuantity) {
		int newQuantity = existingCart.getQuantity() + additionalQuantity;
		if (newQuantity > MAX_QUANTITY) {
			throw new CustomException(ErrorCode.ITEM_QUANTITY_MAX_EXCEEDED);
		}

		existingCart.updateQuantity(newQuantity);
		return cartService.saveCart(existingCart);
	}

	/**
	 * 새 장바구니 항목 생성
	 */
	private Cart createNewCart(User user, Item item, int quantity) {
		Cart cart = Cart.builder()
			.user(user)
			.item(item)
			.quantity(quantity)
			.build();

		return cartService.saveCart(cart);
	}

}