package com.otoki.uptention.presentation.cart.doc;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import com.otoki.uptention.application.cart.dto.request.CartQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
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

	@Operation(summary = "장바구니 조회", description = "사용자의 장바구니 상품 목록을 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "장바구니 조회 성공",
			content = @Content(
				array = @ArraySchema(schema = @Schema(implementation = CartItemDto.class))
			)
		)
	})
	ResponseEntity<List<CartItemDto>> getCartItems();

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

	@Operation(summary = "장바구니 상품 수량 수정", description = "장바구니 내 상품의 수량을 수정합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "장바구니 상품 수량 수정 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "장바구니 상품 수량 수정 성공")
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
						value = "{\"code\":\"X002\",\"message\":\"[quantity] 수량은 필수입니다.\",\"path\":\"/api/shopping-cart/{cartId}/quantity\"}"
					),
					@ExampleObject(
						name = "최소 수량 미달",
						summary = "상품 수량이 1개 미만",
						value = "{\"code\":\"ITEM_008\",\"message\":\"상품 수량은 1개 이상이어야 합니다.\",\"path\":\"/api/shopping-cart/{cartId}/quantity\"}"
					),
					@ExampleObject(
						name = "최대 수량 초과",
						summary = "상품 수량이 99개 초과",
						value = "{\"code\":\"ITEM_009\",\"message\":\"상품 수량은 99개 이하여야 합니다.\",\"path\":\"/api/shopping-cart/{cartId}/quantity\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "장바구니 항목 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "장바구니 항목 없음",
						summary = "요청한 장바구니 항목이 존재하지 않음",
						value = "{\"code\":\"CART_001\",\"message\":\"장바구니 항목을 찾을 수 없습니다.\",\"path\":\"/api/shopping-cart/{cartId}/quantity\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> updateCartItemQuantity(
		@Parameter(description = "장바구니 ID", required = true) @PathVariable Integer cartId,
		@Parameter(description = "수정할 수량 정보", required = true)
		@Valid @RequestBody CartQuantityRequestDto cartQuantityRequestDto);

	@Operation(summary = "장바구니 상품 삭제", description = "장바구니에서 선택한 상품을 삭제합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "장바구니 상품 삭제 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "장바구니 상품 삭제 성공")
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
						value = "{\"code\":\"CART_004\",\"message\":\"장바구니 ID 목록은 필수입니다.\",\"path\":\"/api/shopping-cart\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> removeCartItem(
		@Parameter(description = "삭제할 장바구니 항목 ID 목록", required = true,
			schema = @Schema(type = "array", example = "[1, 2, 3]"))
		@RequestBody List<Integer> cartIds);

	@Operation(summary = "장바구니 상품 개수 조회", description = "사용자의 장바구니에 담긴 상품 종류의 개수를 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "장바구니 상품 개수 조회 성공",
			content = @Content(
				schema = @Schema(implementation = Integer.class),
				examples = {
					@ExampleObject(
						name = "장바구니 개수 예시",
						value = "5"
					)
				}
			)
		)
	})
	ResponseEntity<Integer> getCartItemCount();
}
