package com.otoki.uptention.presentation.gift.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.gift.dto.response.GiftHistoryCursorResponseDto;
import com.otoki.uptention.application.gift.service.GiftAppService;
import com.otoki.uptention.domain.order.enums.GiftStatus;
import com.otoki.uptention.presentation.gift.doc.GiftApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/gifts")
@RequiredArgsConstructor
public class GiftController implements GiftApiDoc {
	private final GiftAppService giftAppService;

	@GetMapping("")
	public ResponseEntity<GiftHistoryCursorResponseDto> getGiftHistory(
		@RequestParam(required = false) String cursor,
		@RequestParam(defaultValue = "10") int size,
		@RequestParam(defaultValue = "PENDING") GiftStatus type) {
		return ResponseEntity.ok(giftAppService.getGiftHistory(cursor, size, type));
	}
}
