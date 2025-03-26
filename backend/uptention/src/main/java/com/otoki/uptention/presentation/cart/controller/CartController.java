package com.otoki.uptention.presentation.cart.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.cart.service.CartAppService;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.presentation.cart.docs.CartApiDoc;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/shopping-cart")
@RequiredArgsConstructor
public class CartController implements CartApiDoc {

	private final CartAppService cartAppService;

	@PostMapping("")
	public ResponseEntity<String> addToCart(@Valid @RequestBody ItemQuantityRequestDto itemQuantityRequestDto) {
		cartAppService.addToCart(itemQuantityRequestDto);
		return ResponseEntity.ok().body("장바구니 담기 성공");
	}
}
