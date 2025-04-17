package com.otoki.uptention.application.order.dto.response;

import java.util.List;

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
@Schema(description = "구매내역 목록 조회 응답 DTO")
public class OrderHistoryCursorResponseDto {
	@Schema(description = "주문 항목 목록")
	private List<OrderItemResponseDto> orderItems;

	@Schema(description = "다음 페이지 존재 여부", example = "true")
	private boolean hasNextPage;

	@Schema(description = "다음 페이지 커서 값", example = "eyJ2YWx1ZSI6MTAwLCJpZCI6MX0=")
	private String nextCursor;
}
