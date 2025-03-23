package com.otoki.uptention.presentation.order.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.service.OrderAppService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

	private final OrderAppService orderAppService;

	@PostMapping("/purchase")
	public ResponseEntity<String> purchaseOrder(@Valid @RequestBody OrderRequestDto orderRequestDto){
		orderAppService.createOrder(orderRequestDto);
		return ResponseEntity.ok("주문 처리 성공");
	}
}
