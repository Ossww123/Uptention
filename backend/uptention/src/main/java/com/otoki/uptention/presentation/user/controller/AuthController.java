package com.otoki.uptention.presentation.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.application.user.service.UserAppService;
import com.otoki.uptention.auth.dto.LoginRequestDto;
import com.otoki.uptention.presentation.user.docs.AuthApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AuthController implements AuthApiDoc {
	private final UserAppService userAppService;

	// 회원가입 메서드
	@PostMapping("/api/join")
	public ResponseEntity<String> joinUser(@RequestBody JoinRequestDto requestDto) {
		userAppService.joinMember(requestDto);

		return ResponseEntity.ok("회원가입 성공");
	}

	// 아이디 중복 검사 엔드포인트
	@GetMapping("/api/join/check-username")
	public ResponseEntity<String> checkDuplicateUsername(@RequestParam String username) {
		// 중복이면 userAppService 내부에서 예외 발생
		userAppService.checkDuplicateUsername(username);
		return ResponseEntity.ok("사용 가능한 아이디입니다.");
	}

	// 사번 중복 검사 엔드포인트
	@GetMapping("/api/join/check-employee-number")
	public ResponseEntity<String> checkDuplicateEmployeeNumber(@RequestParam String employeeNumber) {
		// 중복이면 userAppService 내부에서 예외 발생
		userAppService.checkDuplicateEmployeeNumber(employeeNumber);
		return ResponseEntity.ok("사용 가능한 사번입니다.");
	}

	// Swagger-ui 문서용 메서드, 동작하지 않습니다.
	@PostMapping("/api/login")
	public ResponseEntity<String> signIn(@RequestBody LoginRequestDto loginRequestDto) {
		return ResponseEntity.ok("로그인 성공");
	}
}
