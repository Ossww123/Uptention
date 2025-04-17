package com.otoki.uptention.application.cart.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Schema(description = "장바구니 상품 수량 수정 요청 DTO")
public class CartQuantityRequestDto {
	@Schema(description = "상품 수량", example = "10")
	private Integer quantity;
}
