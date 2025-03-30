package com.otoki.uptention.presentation.mining.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.mining.service.dto.response.PointResponseDto;
import com.otoki.uptention.application.mining.service.PointAppService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointController {

	private final PointAppService pointAppService;

	@GetMapping
	public ResponseEntity<PointResponseDto> getPoint() {
		return ResponseEntity.ok(pointAppService.getPoint());
	}
}
