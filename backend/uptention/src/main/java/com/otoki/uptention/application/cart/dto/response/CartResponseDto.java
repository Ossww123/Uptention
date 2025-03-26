package com.otoki.uptention.application.cart.dto.response;

import java.util.List;

import com.otoki.uptention.domain.cart.dto.CartItemDto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "장바구니 상품 응답")
public class CartResponseDto {
	private List<CartItemDto> items;
}
