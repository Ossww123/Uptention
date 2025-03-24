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
import com.otoki.uptention.presentation.item.doc.ItemApiDoc;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@Tag(name = "마켓 상품 API", description = "상품의 기본적인 CRUD와 조회를 담당하는 컨트롤러")
public class ItemController implements ItemApiDoc {
	private final ItemAppService itemAppService;

	@GetMapping("/{itemId}")
	public ResponseEntity<ItemResponseDto> getItemDetails(@PathVariable Integer itemId) {
		ItemResponseDto itemResponseDto = itemAppService.getItemDetails(itemId);
		return ResponseEntity.ok(itemResponseDto);
	}

	@GetMapping("")
	public ResponseEntity<ItemListResponseDto> getItems(
		@RequestParam(required = false) Integer categoryId,
		@RequestParam(required = false) String keyword,
		@RequestParam(required = false) String cursor,
		@RequestParam(defaultValue = "20") int size,
		@RequestParam(defaultValue = "SALES") SortType sort) {

		ItemListResponseDto response = itemAppService.getItems(categoryId, keyword, cursor, sort, size);
		return ResponseEntity.ok(response);
	}
}