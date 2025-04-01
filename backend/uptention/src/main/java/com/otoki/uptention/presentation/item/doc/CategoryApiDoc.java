package com.otoki.uptention.presentation.item.doc;

import java.util.List;

import org.springframework.http.ResponseEntity;

import com.otoki.uptention.application.item.dto.response.CategoryResponseDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "카테고리 API", description = "상품 카테고리 관련 API")
public interface CategoryApiDoc {

	@Operation(
		summary = "전체 카테고리 목록 조회",
		description = "시스템에 등록된 모든 상품 카테고리 목록을 조회합니다."
	)
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "카테고리 목록 조회 성공",
			content = @Content(
				mediaType = "application/json",
				array = @ArraySchema(schema = @Schema(implementation = CategoryResponseDto.class))
			)
		)
	})
	ResponseEntity<List<CategoryResponseDto>> getAllCategories();
}