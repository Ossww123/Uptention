package com.otoki.uptention.presentation.user.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.user.dto.response.PointResponseDto;
import com.otoki.uptention.application.user.service.UserAppService;

import lombok.RequiredArgsConstructor;

@RequestMapping("/api/users")
@RestController
@RequiredArgsConstructor
public class UserController {

	private final UserAppService userAppService;

	@GetMapping("/{userId}/point")
	public PointResponseDto getUserPoint(@PathVariable Integer userId) {
		return userAppService.getUserPoints(userId);
	}
}
