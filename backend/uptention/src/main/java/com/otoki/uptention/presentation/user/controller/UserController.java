package com.otoki.uptention.presentation.user.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.mining.service.MiningTimeAppService;
import com.otoki.uptention.application.mining.service.dto.response.MiningTimeResponseDto;
import com.otoki.uptention.application.user.dto.response.PointResponseDto;
import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;
import com.otoki.uptention.application.user.dto.response.UserCursorResponseDto;
import com.otoki.uptention.application.user.dto.response.UserResponseDto;
import com.otoki.uptention.application.user.service.UserAppService;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;
import com.otoki.uptention.presentation.user.docs.UserApiDoc;

import lombok.RequiredArgsConstructor;

@RequestMapping("/api/users")
@RestController
@RequiredArgsConstructor
public class UserController implements UserApiDoc {
	private final UserAppService userAppService;
	private final MiningTimeAppService miningTimeAppService;

	// 유저 정보 조회
	@GetMapping("/{userId}")
	public ResponseEntity<UserResponseDto> getUser(@PathVariable Integer userId) {
		return ResponseEntity.ok(userAppService.getUser(userId));
	}

	// 유저 정보 페이징 조회
	@GetMapping("")
	public ResponseEntity<UserCursorResponseDto> getUsers(
		@RequestParam(required = false) UserRole userRole,
		@RequestParam(required = false) String keyword,
		@RequestParam(required = false) String cursor,
		@RequestParam(defaultValue = "20") int size,
		@RequestParam(defaultValue = "NAMES_ASC") UserSortType sort) {

		UserCursorResponseDto response = userAppService.getUsers(userRole, keyword, cursor, sort, size);
		return ResponseEntity.ok(response);
	}

	// 유저 삭제
	@DeleteMapping("/{userId}")
	public ResponseEntity<String> deleteUser(@PathVariable Integer userId) {
		userAppService.removeUser(userId);
		return ResponseEntity.ok("회원 삭제 성공");
	}

	// 프로필 이미지 등록 및 수정
	@PutMapping(value = "/{userId}/profiles", consumes = "multipart/form-data")
	public ResponseEntity<ProfileImageResponseDto> updateProfileImage(
		@PathVariable Integer userId,
		@RequestParam("profileImage") MultipartFile profileImage) {
		return ResponseEntity.ok(userAppService.updateProfileImage(userId, profileImage));
	}

	// 기본 프로필 이미지로 변경
	@DeleteMapping("/{userId}/profiles")
	public ResponseEntity<ProfileImageResponseDto> deleteProfileImage(@PathVariable Integer userId) {
		return ResponseEntity.ok(userAppService.removeProfileImage(userId));
	}

	// 유저 포인트 조회
	@GetMapping("/{userId}/point")
	public ResponseEntity<PointResponseDto> getUserPoint(@PathVariable Integer userId) {
		return ResponseEntity.ok(userAppService.getUserPoints(userId));
	}

	// 유저 채굴시간 조회
	@GetMapping("/{userId}/mining-times")
	public ResponseEntity<List<MiningTimeResponseDto>> getMiningTimes(
		@PathVariable Integer userId,
		@RequestParam LocalDateTime startTime,
		@RequestParam LocalDateTime endTime) {
		return ResponseEntity.ok(miningTimeAppService.findAllMiningTimes(userId, startTime, endTime));
	}
}
