package com.otoki.uptention.presentation.item.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.item.dto.response.ItemListResponseDto;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.application.item.service.ItemAppService;
import com.otoki.uptention.domain.item.enums.SortType;
import com.otoki.uptention.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@Tag(name = "마켓 상품 API", description = "상품의 기본적인 CRUD와 조회를 담당하는 컨트롤러")
public class ItemController {
	private final ItemAppService itemAppService;

	@GetMapping("/{itemId}")
	@Operation(summary = "상품 상세 정보", description = "목록에서 선택한 상품의 상세 정보 조회")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "상품 상세 정보 조회 성공",
			content = @Content(schema = @Schema(implementation = ItemResponseDto.class))),
		@ApiResponse(responseCode = "404", description = "상품을 찾을 수 없음",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
	})
	public ResponseEntity<ItemResponseDto> getItemDetails(
		@Parameter(description = "상품 ID", example = "1")
		@PathVariable Integer itemId) {
		ItemResponseDto itemResponseDto = itemAppService.getItemDetails(itemId);

		return ResponseEntity.ok(itemResponseDto);
	}

	@GetMapping("")
	@Operation(summary = "상품 목록 정보", description = "마켓 플레이스에 등록된 모든 상품 목록 조회")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "상품 목록 조회 성공",
			content = @Content(schema = @Schema(implementation = ItemListResponseDto.class))),
		@ApiResponse(responseCode = "404", description = "존재하지 않는 카테고리",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
		@ApiResponse(responseCode = "400", description = "올바르지 않은 정렬 조건",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
	})
	public ResponseEntity<ItemListResponseDto> getItems(
		@Parameter(description = "카테고리 ID >> 1:가전디지털, 2:뷰티, 3:리빙/키친, 4:패션의류/잡화, 5:문화여가, 6:생활용품, 7:식품, 8:키즈")
		@RequestParam(required = false) Integer categoryId,

		@Parameter(description = "검색 키워드")
		@RequestParam(required = false) String keyword,

		@Parameter(description = "페이지네이션 커서")
		@RequestParam(required = false) String cursor,

		@Parameter(description = "페이지 크기")
		@RequestParam(defaultValue = "20") int size,

		@Parameter(description = "정렬 방식")
		@RequestParam(defaultValue = "SALES") SortType sort) {

		ItemListResponseDto response = itemAppService.getItems(categoryId, keyword, cursor, sort, size);
		return ResponseEntity.ok(response);
	}

}
