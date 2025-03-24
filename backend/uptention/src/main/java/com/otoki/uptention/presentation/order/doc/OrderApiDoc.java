package com.otoki.uptention.presentation.order.doc;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;

import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;

/**
 * 주문 API 문서화를 위한 인터페이스
 * 실제 구현체는 없으며, Swagger 문서화 목적으로만 사용됩니다.
 */
public interface OrderApiDoc {

	@Operation(summary = "상품 주문", description = "주문 정보를 받아 주문을 생성합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "주문 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "주문 처리 성공")
				}
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "재고 부족 또는 잘못된 요청",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "재고 부족",
						summary = "요청한 상품의 재고가 부족함",
						value = "{\"code\":\"ITEM_004\",\"message\":\"재고가 부족한 상품이 있습니다.\",\"path\":\"/api/orders/purchase\"}"
					),
					@ExampleObject(
						name = "유효성 검증 실패",
						summary = "잘못된 형식의 요청",
						value = "{\"code\":\"X002\",\"message\":\"[address] 배송 주소는 필수입니다.; [items] 주문 상품 목록은 필수입니다.\",\"path\":\"/api/orders/purchase\"}"
					)

				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "상품 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "상품 존재하지 않음",
						summary = "요청한 상품이 존재하지 않음",
						value = "{\"code\":\"ITEM_001\",\"message\":\"상품이 존재하지 않습니다.\",\"path\":\"/api/orders/purchase\"}"
					)
				}
			)
		),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
	})
	ResponseEntity<String> purchaseOrder(
		@Parameter(description = "주문 정보", required = true,
			examples = {
				@ExampleObject(
					name = "기본 주문 예시",
					summary = "여러 상품 주문 예시",
					value = "{\"items\":[{\"itemId\":1,\"quantity\":1},{\"itemId\":2,\"quantity\":1},{\"itemId\":3,\"quantity\":1}],\"address\":\"사랑시 고백구 행복동\"}"
				)
			})
		@Valid @RequestBody OrderRequestDto orderRequestDto);

	@Operation(summary = "상품 선물", description = "선물 정보를 받아 선물 주문을 생성합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "선물 주문 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "선물 처리 성공")
				}
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "재고 부족 또는 잘못된 요청",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "재고 부족",
						summary = "선물할 상품의 재고가 부족함",
						value = "{\"code\":\"ITEM_004\",\"message\":\"재고가 부족한 상품이 있습니다.\",\"path\":\"/api/orders/gift\"}"
					),
					@ExampleObject(
						name = "유효성 검증 실패",
						summary = "선물 받는 사용자 ID 누락",
						value = "{\"code\":\"X002\",\"message\":\"[receiverId] 선물 받는 사용자 id는 필수입니다.\",\"path\":\"/api/orders/gift\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "사용자 또는 상품 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "사용자 없음",
						summary = "선물 받는 사용자가 존재하지 않음",
						value = "{\"code\":\"USER_001\",\"message\":\"사용자를 찾을 수 없습니다.\",\"path\":\"/api/orders/gift\"}"
					),
					@ExampleObject(
						name = "상품 존재하지 않음",
						summary = "요청한 상품이 존재하지 않음",
						value = "{\"code\":\"ITEM_001\",\"message\":\"상품이 존재하지 않습니다.\",\"path\":\"/api/orders/gift\"}"
					)
				}
			)
		),
		@ApiResponse(responseCode = "500", description = "서버 오류", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
	})
	ResponseEntity<String> giftOrder(
		@Parameter(description = "선물 정보", required = true,
			examples = {
				@ExampleObject(
					name = "기본 선물 예시",
					summary = "선물 요청 예시",
					value = "{\"itemId\":3,\"receiverId\":5}"
				)
			})
		@Valid @RequestBody GiftRequestDto giftRequestDto);
}