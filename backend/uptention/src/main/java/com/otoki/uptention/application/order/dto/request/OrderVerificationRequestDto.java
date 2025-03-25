package com.otoki.uptention.application.order.dto.request;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "주문 전 상품 검증 요청 DTO")
public class OrderVerificationRequestDto {
	private List<ItemVerificationDto> items;
}
