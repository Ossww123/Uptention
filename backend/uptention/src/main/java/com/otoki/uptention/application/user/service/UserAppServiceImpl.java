package com.otoki.uptention.application.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAppServiceImpl implements UserAppService {
	private final UserService userService;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public void joinUser(JoinRequestDto requestDto) {
		// DTO를 도메인 객체(User)로 변환합니다.
		User user = User.builder()
			.username(requestDto.getUsername())
			.password(passwordEncoder.encode(requestDto.getPassword()))
			.name(requestDto.getName())
			.employeeNumber(requestDto.getEmployeeNumber())
			.build();

		userService.join(user);
	}

	// 회원가입 신청 전 username 중복검사
	@Override
	public void checkDuplicateUsername(String username) {
		userService.validateDuplicateUsername(username);
	}

	// 회원가입 신청 전 사번 중복검사
	@Override
	public void checkDuplicateEmployeeNumber(String employeeNumber) {
		userService.validateDuplicateEmployeeNumber(employeeNumber);
	}
}
