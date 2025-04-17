package com.otoki.uptention.application.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "선물 요청 DTO")
public class GiftRequestDto {
	@NotNull(message = "주문 상품 id는 필수입니다.")
	@Schema(description = "상품 ID", example = "1", required = true)
	private Integer itemId;

	@NotNull(message = "선물 받는 사용자 id는 필수입니다.")
	@Schema(description = "수신자 ID", example = "3", required = true)
	private Integer receiverId;
}
