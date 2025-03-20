package com.otoki.uptention.presentation.item.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.application.item.service.ItemAppService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {
	private final ItemAppService itemAppService;

	@GetMapping("/{itemId}")
	public ResponseEntity<ItemResponseDto> getItemDetails(@PathVariable Integer itemId) {
		ItemResponseDto itemResponseDto = itemAppService.getItemDetails(itemId);

		return ResponseEntity.ok(itemResponseDto);
	}
}
