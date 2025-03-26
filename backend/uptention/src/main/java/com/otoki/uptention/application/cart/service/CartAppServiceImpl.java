package com.otoki.uptention.application.cart.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.domain.cart.entity.Cart;
import com.otoki.uptention.domain.cart.service.CartService;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartAppServiceImpl implements CartAppService {

	private final CartService cartService;
	private final ItemService itemService;
	private final UserService userService;

	@Transactional
	@Override
	public Cart addToCart(ItemQuantityRequestDto itemQuantityRequestDto) {
		// security 구현 후, 코드 수정 필요
		User user = userService.getUserById(1);
		Item item = itemService.getItemById(itemQuantityRequestDto.getItemId());

		// 이미 장바구니에 같은 상품이 있는지 확인
		Cart existingCart = cartService.getByUserAndItem(user.getId(), itemQuantityRequestDto.getItemId());

		// 이미 장바구니에 있으면 수량 증가
		if (existingCart != null) {
			existingCart.updateQuantity(existingCart.getQuantity() + itemQuantityRequestDto.getQuantity());
			return cartService.saveCart(existingCart);
		}

		// 장바구니에 없으면 새로 추가
		Cart cart = Cart.builder()
			.user(user)
			.item(item)
			.quantity(itemQuantityRequestDto.getQuantity())
			.build();

		return cartService.saveCart(cart);

	}
}
