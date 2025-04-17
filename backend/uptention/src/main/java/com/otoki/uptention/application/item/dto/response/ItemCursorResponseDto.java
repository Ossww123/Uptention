package com.otoki.uptention.application.item.dto.response;

import java.util.List;

import com.otoki.uptention.domain.item.dto.ItemDto;

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
@Schema(description = "상품 목록 조회 응답 DTO")
public class ItemCursorResponseDto {
	@Schema(description = "상품 목록")
	private List<ItemDto> items;

	@Schema(description = "다음 페이지 존재 여부", example = "true")
	private boolean hasNextPage;

	@Schema(description = "다음 페이지 커서 값", example = "eyJ2YWx1ZSI6MTAwLCJpZCI6MX0=")
	private String nextCursor;
}
