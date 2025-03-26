package com.otoki.uptention.application.order.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "검증된 상품 응답 DTO")
public class OrderVerificationResponseDto {
	private List<ItemVerificationResponseDto> items;
}