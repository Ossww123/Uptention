package com.otoki.uptention.application.order.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "주문 초기화 응답 DTO")
public class InitiateOrderResponseDto {
	@Schema(description = "주문 ID", example = "1")
	private Integer orderId;

	@Schema(description = "결제 금액", example = "1000")
	private Integer paymentAmount;
}
