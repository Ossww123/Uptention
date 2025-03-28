package com.otoki.uptention.presentation.mining.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.mining.service.MiningTimeAppService;
import com.otoki.uptention.presentation.mining.doc.MiningApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/focus")
@RequiredArgsConstructor
public class MiningTimeController implements MiningApiDoc {

	private final MiningTimeAppService miningTimeAppService;

	@PostMapping
	public ResponseEntity<String> focusModeOn() {
		miningTimeAppService.focusModeOn(1);
		return ResponseEntity.ok("집중모드 시작");
	}

	@PatchMapping
	public ResponseEntity<String> focusModeOff() {
		miningTimeAppService.focusModeOff(1);
		return ResponseEntity.ok("집중모드 종료");
	}
}
