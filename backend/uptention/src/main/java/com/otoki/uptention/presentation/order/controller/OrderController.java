package com.otoki.uptention.presentation.order.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.order.dto.request.DeliveryInfoRequestDto;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.service.OrderAppService;
import com.otoki.uptention.presentation.order.doc.OrderApiDoc;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "상품 주문/조회 API", description = "상품 일반 주문, 선물, 내역 조회를 담당하는 컨트롤러")
public class OrderController implements OrderApiDoc {

	private final OrderAppService orderAppService;

	@PostMapping("/purchase")
	public ResponseEntity<String> purchaseOrder(@Valid @RequestBody OrderRequestDto orderRequestDto){
		orderAppService.createOrder(orderRequestDto);
		return ResponseEntity.ok("주문 처리 성공");
	}

	@PostMapping("/gift")
	public ResponseEntity<String> giftOrder(@Valid @RequestBody GiftRequestDto giftRequestDto){
		orderAppService.createGiftOrder(giftRequestDto);
		return ResponseEntity.ok("선물 처리 성공");
	}

	@PostMapping("/{orderId}/delivery-info")
	public ResponseEntity<?> registerDeliveryInfo(@PathVariable Integer orderId, @Valid @RequestBody DeliveryInfoRequestDto deliveryInfoRequestDto){
		orderAppService.registerDeliveryInfo(orderId, deliveryInfoRequestDto);
		return ResponseEntity.ok("배송지 정보 등록 성공");
	}

}
