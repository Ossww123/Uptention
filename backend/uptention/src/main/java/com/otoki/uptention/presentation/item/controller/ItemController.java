package com.otoki.uptention.presentation.item.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.item.dto.request.ItemCreateRequestDto;
import com.otoki.uptention.application.item.dto.request.ItemUpdateRequestDto;
import com.otoki.uptention.application.item.dto.response.ItemCursorResponseDto;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.application.item.service.ItemAppService;
import com.otoki.uptention.domain.item.enums.SortType;
import com.otoki.uptention.presentation.item.doc.ItemApiDoc;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController implements ItemApiDoc {
	private final ItemAppService itemAppService;

	@GetMapping("/{itemId}")
	public ResponseEntity<ItemResponseDto> getItemDetails(@PathVariable Integer itemId) {
		ItemResponseDto itemResponseDto = itemAppService.getItemDetails(itemId);
		return ResponseEntity.ok(itemResponseDto);
	}

	@GetMapping("")
	public ResponseEntity<ItemCursorResponseDto> getItems(
		@RequestParam(required = false) Integer categoryId,
		@RequestParam(required = false) String keyword,
		@RequestParam(required = false) String cursor,
		@RequestParam(defaultValue = "20") int size,
		@RequestParam(defaultValue = "SALES") SortType sort) {

		ItemCursorResponseDto response = itemAppService.getItems(categoryId, keyword, cursor, sort, size);
		return ResponseEntity.ok(response);
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<String> registerItem(
		@Valid @RequestPart("item") ItemCreateRequestDto itemCreateRequestDto,
		@RequestPart("images") List<MultipartFile> images) {

		itemAppService.createItem(itemCreateRequestDto, images);
		return ResponseEntity.ok("상품 등록 완료");
	}

	@DeleteMapping("/{itemId}")
	public ResponseEntity<String> deleteItem(@PathVariable Integer itemId) {
		itemAppService.deleteItem(itemId);
		return ResponseEntity.ok("상품 삭제 완료");
	}

	@PatchMapping("/{itemId}")
	public ResponseEntity<String> updateItem(
		@PathVariable Integer itemId,
		@RequestBody @Valid ItemUpdateRequestDto updateRequest) {
		itemAppService.updateItem(itemId, updateRequest);
		return ResponseEntity.ok("상품 수정 완료");
	}

}