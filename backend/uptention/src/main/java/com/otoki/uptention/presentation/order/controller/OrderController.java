package com.otoki.uptention.presentation.order.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.order.dto.request.DeliveryInfoRequestDto;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemVerificationDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.dto.response.ItemVerificationResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderDetailResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderHistoryCursorResponseDto;
import com.otoki.uptention.application.order.service.OrderAppService;
import com.otoki.uptention.application.order.service.OrderVerifyAppService;
import com.otoki.uptention.domain.order.enums.OrderHistoryType;
import com.otoki.uptention.presentation.order.doc.OrderApiDoc;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController implements OrderApiDoc {

	private final OrderAppService orderAppService;
	private final OrderVerifyAppService orderVerifyAppService;

	@PostMapping("/purchase")
	public ResponseEntity<String> purchaseOrder(@Valid @RequestBody OrderRequestDto orderRequestDto) {
		orderAppService.createOrder(orderRequestDto);
		return ResponseEntity.ok("주문 처리 성공");
	}

	@PostMapping("/gift")
	public ResponseEntity<String> giftOrder(@Valid @RequestBody GiftRequestDto giftRequestDto) {
		orderAppService.createGiftOrder(giftRequestDto);
		return ResponseEntity.ok("선물 처리 성공");
	}

	@PostMapping("/verify")
	public ResponseEntity<List<ItemVerificationResponseDto>> verifyOrderItem(
		@Valid @RequestBody List<ItemVerificationDto> itemVerificationDtos) {
		return ResponseEntity.ok(orderVerifyAppService.verifyOrderItem(itemVerificationDtos));
	}

	@PostMapping("/{orderId}/delivery-info")
	public ResponseEntity<String> registerDeliveryInfo(@PathVariable Integer orderId,
		@Valid @RequestBody DeliveryInfoRequestDto deliveryInfoRequestDto) {
		orderAppService.registerDeliveryInfo(orderId, deliveryInfoRequestDto);
		return ResponseEntity.ok("배송지 정보 등록 성공");
	}

	@GetMapping("")
	public ResponseEntity<OrderHistoryCursorResponseDto> getOrderHistory(
		@RequestParam(required = false) String cursor,
		@RequestParam(defaultValue = "10") int size,
		@RequestParam(defaultValue = "PURCHASE") OrderHistoryType type) {
		return ResponseEntity.ok(orderAppService.getOrderHistory(cursor, size, type));
	}

	@GetMapping("/{orderId}/order-items/{orderItemId}")
	public ResponseEntity<OrderDetailResponseDto> getOrderDetail(
		@PathVariable Integer orderId,
		@PathVariable Integer orderItemId) {
		return ResponseEntity.ok(orderAppService.getOrderDetail(orderId, orderItemId));
	}

}
