package com.otoki.uptention.application.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Schema(description = "상품 수량 요청 DTO")
public class ItemQuantityRequestDto {

	@Schema(description = "상품 ID", example = "1", required = true)
	private Integer itemId;

	@Schema(description = "상품 수량", example = "1", required = true)
	private Integer quantity;
}
