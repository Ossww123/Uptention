package com.otoki.uptention.application.item.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
@Schema(description = "상품 카테고리 목록 조회 응답 DTO")
public class CategoryResponseDto {

	@Schema(description = "카테고리 ID", example = "1")
	private Integer categoryId;

	@Schema(description = "카테고리명", example = "리빙가전")
	private String name;
}
