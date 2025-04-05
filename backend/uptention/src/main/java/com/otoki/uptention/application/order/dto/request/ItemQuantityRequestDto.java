package com.otoki.uptention.application.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "상품 수량 요청 DTO")
public class ItemQuantityRequestDto {

	@NotNull(message = "상품 ID는 필수입니다")
	@Schema(description = "상품 ID", example = "1", required = true)
	private Integer itemId;

	@NotNull(message = "상품 수량은 필수입니다")
	@Min(value = 1, message = "상품 수량은 1 이상이어야 합니다")
	@Schema(description = "상품 수량", example = "1", required = true)
	private Integer quantity;
}
