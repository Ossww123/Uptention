package com.otoki.uptention.presentation.mining.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.mining.service.MiningTimeAppService;
import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;
import com.otoki.uptention.presentation.mining.doc.MiningApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mining-time")
@RequiredArgsConstructor
public class MiningTimeController implements MiningApiDoc {

	private final MiningTimeAppService miningTimeAppService;

	@PostMapping("/focus")
	public ResponseEntity<String> focusModeOn() {
		miningTimeAppService.focusModeOn(1);
		return ResponseEntity.ok("집중모드 시작");
	}

	@PatchMapping("/focus")
	public ResponseEntity<String> focusModeOff() {
		miningTimeAppService.focusModeOff(1);
		return ResponseEntity.ok("집중모드 종료");
	}

	@GetMapping()
	public ResponseEntity<Map<String, List<MiningTimeRankResponseDto>>> getMiningTimes(@RequestParam Integer top) {
		return ResponseEntity.ok(miningTimeAppService.findMiningRank(top));
	}
}
