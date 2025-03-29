package com.otoki.uptention.presentation.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;
import com.otoki.uptention.application.user.service.UserAppService;
import com.otoki.uptention.presentation.user.docs.UserApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController implements UserApiDoc {
	private final UserAppService userAppService;

	// 프로필 이미지 등록 및 수정
	@PutMapping(value = "/api/users/{userId}/profiles", consumes = "multipart/form-data")
	public ResponseEntity<ProfileImageResponseDto> updateProfileImage(
		@PathVariable Integer userId,
		@RequestParam("profileImage") MultipartFile profileImage) {
		return ResponseEntity.ok(userAppService.updateProfileImage(userId, profileImage));
	}

	// 기본 프로필 이미지로 변경
	@DeleteMapping("/api/users/{userId}/profiles")
	public ResponseEntity<ProfileImageResponseDto> deleteProfileImage(@PathVariable Integer userId) {
		return ResponseEntity.ok(userAppService.removeProfileImage(userId));
	}
}
