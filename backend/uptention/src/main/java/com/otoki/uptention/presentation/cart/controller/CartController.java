package com.otoki.uptention.presentation.cart.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.cart.dto.request.CartQuantityRequestDto;
import com.otoki.uptention.application.cart.service.CartAppService;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.presentation.cart.doc.CartApiDoc;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/shopping-cart")
@RequiredArgsConstructor
public class CartController implements CartApiDoc {

	private final CartAppService cartAppService;

	@GetMapping("")
	public ResponseEntity<List<CartItemDto>> getCartItems() {
		return ResponseEntity.ok(cartAppService.getUserCartItems());
	}

	@PostMapping("")
	public ResponseEntity<String> addToCart(@Valid @RequestBody ItemQuantityRequestDto itemQuantityRequestDto) {
		cartAppService.addToCart(itemQuantityRequestDto);
		return ResponseEntity.ok().body("장바구니 담기 성공");
	}

	@PatchMapping("/{cartId}/quantity")
	public ResponseEntity<String> updateCartItemQuantity(@PathVariable Integer cartId,
		@Valid @RequestBody CartQuantityRequestDto cartQuantityRequestDto) {
		cartAppService.updateCartItemQuantity(cartId, cartQuantityRequestDto);
		return ResponseEntity.ok("장바구니 상품 수량 수정 성공");
	}

	@DeleteMapping("")
	public ResponseEntity<String> removeCartItem(@RequestBody List<Integer> cartIds) {
		cartAppService.removeCartItem(cartIds);
		return ResponseEntity.ok("장바구니 상품 삭제 성공");
	}

	@GetMapping("/count")
	public ResponseEntity<Integer> getCartItemCount() {
		return ResponseEntity.ok(cartAppService.countCartItems());
	}

}
