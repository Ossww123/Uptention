package com.otoki.uptention.presentation.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;
import com.otoki.uptention.application.user.dto.response.UserCursorResponseDto;
import com.otoki.uptention.application.user.dto.response.UserResponseDto;
import com.otoki.uptention.application.user.service.UserAppService;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;
import com.otoki.uptention.presentation.user.docs.UserApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController implements UserApiDoc {
	private final UserAppService userAppService;

	// 유저 정보 조회
	@GetMapping("/api/users/{userId}")
	public ResponseEntity<UserResponseDto> getUser(@PathVariable Integer userId) {
		return ResponseEntity.ok(userAppService.getUser(userId));
	}

	// 유저 정보 페이징 조회
	@GetMapping("/api/users")
	public ResponseEntity<UserCursorResponseDto> getUsers(
		@RequestParam(required = false) UserRole userRole,
		@RequestParam(required = false) String keyword,
		@RequestParam(required = false) String cursor,
		@RequestParam(defaultValue = "20") int size,
		@RequestParam(defaultValue = "NAMES_DESC") UserSortType sort) {

		UserCursorResponseDto response = userAppService.getUsers(userRole, keyword, cursor, sort, size);
		return ResponseEntity.ok(response);
	}

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
