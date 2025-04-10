package com.otoki.uptention.application.cart.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.cart.dto.request.CartQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.domain.cart.entity.Cart;
import com.otoki.uptention.domain.cart.service.CartService;
import com.otoki.uptention.domain.inventory.dto.InventoryDto;
import com.otoki.uptention.domain.inventory.service.InventoryService;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.otoki.uptention.global.service.ImageUploadService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CartAppServiceImpl implements CartAppService {

	private static final int MIN_QUANTITY = 1;
	private static final int MAX_QUANTITY = 99;

	private final CartService cartService;
	private final ItemService itemService;
	private final SecurityService securityService;
	private final ImageUploadService imageUploadService;
	private final InventoryService inventoryService;

	/**
	 * 장바구니에 상품 추가
	 * 수량은 1~99개 사이로 제한
	 */
	@Transactional
	@Override
	public Cart addToCart(ItemQuantityRequestDto itemQuantityRequestDto) {
		validateQuantity(itemQuantityRequestDto.getQuantity());

		User user = securityService.getLoggedInUser();
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
		User user = securityService.getLoggedInUser();

		// 1. 장바구니 항목 조회 (MySQL에서 기존 데이터 조회)
		List<CartItemDto> cartItems = cartService.getCartItemsByUserId(user.getId());

		// 2. 이미지 URL 변환 처리
		cartItems.forEach(cartItem -> {
			if (cartItem.getThumbnail() != null && !cartItem.getThumbnail().isEmpty()) {
				String fullImageUrl = imageUploadService.getImageUrl(cartItem.getThumbnail());
				cartItem.updateThumbnail(fullImageUrl);
			}
		});

		// 3. Redis에서 재고 정보 조회 후, 각 CartItem에 반영 (배치 조회 활용)
		try {
			// 장바구니에 담긴 모든 아이템의 ID 수집
			List<Integer> itemIds = cartItems.stream()
				.map(CartItemDto::getItemId)
				.collect(Collectors.toList());

			// Redis에서 한 번에 여러 상품의 재고 정보를 조회
			Map<Integer, InventoryDto> inventoryMap = inventoryService.getInventories(itemIds);

			// 각 CartItem에 대해 재고 정보 업데이트 (예: 실시간 가용 수량 반영)
			cartItems.forEach(cartItem -> {
				InventoryDto inventoryDto = inventoryMap.get(cartItem.getItemId());
				if (inventoryDto != null) {
					// CartItemDto에 availableQuantity 필드가 있다고 가정하고 업데이트
					cartItem.setQuantity(inventoryDto.getAvailableQuantity());
				}
			});
		} catch (Exception e) {
			// Redis 조회 실패 시에는 로그만 남기고, 기존 MySQL 값을 사용하도록 처리
			log.warn("Redis에서 재고 정보를 가져오지 못했습니다. 기존 데이터를 사용합니다: {}", e.getMessage());
		}

		return cartItems;
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
		User user = securityService.getLoggedInUser();
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