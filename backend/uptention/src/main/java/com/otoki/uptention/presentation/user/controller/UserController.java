package com.otoki.uptention.presentation.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;
import com.otoki.uptention.application.user.service.UserAppService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController {
	private final UserAppService userAppService;

	@PutMapping(value = "/api/users/{userId}/profiles", consumes = "multipart/form-data")
	public ResponseEntity<ProfileImageResponseDto> updateProfileImage(
		@PathVariable Integer userId,
		@RequestParam("profileImage") MultipartFile profileImage) {
		ProfileImageResponseDto profileImageResponseDto = userAppService.updateProfileImage(userId, profileImage);

		return ResponseEntity.ok(profileImageResponseDto);
	}
}
