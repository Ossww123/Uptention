package com.otoki.uptention.application.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Schema(description = "구매할 상품 정보 DTO")
public class ItemVerificationDto {
	@Schema(description = "상품 ID", example = "1")
	private Integer itemId;

	@Schema(description = "상품 가격", example = "100")
	private Integer price;

	@Schema(description = "구매 수량", example = "10")
	private Integer quantity;
}
