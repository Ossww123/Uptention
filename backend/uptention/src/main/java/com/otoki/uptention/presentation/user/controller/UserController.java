package com.otoki.uptention.presentation.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.application.user.service.UserAppService;
import com.otoki.uptention.presentation.user.docs.UserApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController implements UserApiDoc {
	private final UserAppService userAppService;

	// 회원가입 메서드
	@PostMapping("/api/users")
	public ResponseEntity<String> joinUser(@RequestBody JoinRequestDto requestDto) {
		userAppService.joinUser(requestDto);

		return ResponseEntity.ok("회원가입 성공");
	}
}
