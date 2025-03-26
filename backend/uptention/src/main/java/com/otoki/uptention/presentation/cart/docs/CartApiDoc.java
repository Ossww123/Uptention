package com.otoki.uptention.presentation.cart.docs;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;

import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * 장바구니 API 문서화를 위한 인터페이스
 * 실제 구현체는 없으며, Swagger 문서화 목적으로만 사용됩니다.
 */
@Tag(name = "장바구니 API", description = "장바구니를 담당하는 컨트롤러")
public interface CartApiDoc {

	@Operation(summary = "장바구니 담기", description = "상품을 장바구니에 추가합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "장바구니 담기 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "장바구니 담기 성공")
				}
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "잘못된 요청",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "유효성 검증 실패",
						summary = "필수 파라미터 누락",
						value = "{\"code\":\"X002\",\"message\":\"[itemId] 상품 ID는 필수입니다.; [quantity] 수량은 필수입니다.\",\"path\":\"/api/shopping-cart\"}"
					),
					@ExampleObject(
						name = "최소 수량 미달",
						summary = "상품 수량이 1개 미만",
						value = "{\"code\":\"ITEM_008\",\"message\":\"상품 수량은 1개 이상이어야 합니다.\",\"path\":\"/api/shopping-cart\"}"
					),
					@ExampleObject(
						name = "최대 수량 초과",
						summary = "상품 수량이 99개 초과",
						value = "{\"code\":\"ITEM_009\",\"message\":\"상품 수량은 99개 이하여야 합니다.\",\"path\":\"/api/shopping-cart\"}"
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
						summary = "요청한 사용자가 존재하지 않음",
						value = "{\"code\":\"USER_001\",\"message\":\"사용자를 찾을 수 없습니다.\",\"path\":\"/api/shopping-cart\"}"
					),
					@ExampleObject(
						name = "상품 없음",
						summary = "요청한 상품이 존재하지 않음",
						value = "{\"code\":\"ITEM_001\",\"message\":\"상품이 존재하지 않습니다.\",\"path\":\"/api/shopping-cart\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> addToCart(
		@Parameter(description = "장바구니에 담을 상품 정보", required = true)
		@Valid @RequestBody ItemQuantityRequestDto itemQuantityRequestDto);
}