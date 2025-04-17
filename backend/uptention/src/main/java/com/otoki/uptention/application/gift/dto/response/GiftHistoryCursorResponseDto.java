package com.otoki.uptention.application.gift.dto.response;

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
@Schema(description = "선물함 목록 조회 응답 DTO")
public class GiftHistoryCursorResponseDto {
	@Schema(description = "선물 항목 목록")
	private List<GiftItemResponseDto> giftItems;

	@Schema(description = "다음 페이지 존재 여부", example = "true")
	private boolean hasNextPage;

	@Schema(description = "다음 페이지 커서 값", example = "eyJ2YWx1ZSI6MCwiaWQiOjF9")
	private String nextCursor;
}
