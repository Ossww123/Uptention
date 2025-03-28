package com.otoki.uptention.application.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAppServiceImpl implements UserAppService {
	private final UserService userService;
	private final SecurityService securityService;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public void joinMember(JoinRequestDto requestDto) { // 일반 멤버 회원가입
		User admin = securityService.getLoggedInUser(); // 관리자 정보 조회

		// DTO를 도메인 객체(User)로 변환합니다.
		User user = User.builder()
			.username(requestDto.getUsername())
			.password(passwordEncoder.encode(requestDto.getPassword()))
			.name(requestDto.getName())
			.employeeNumber(requestDto.getEmployeeNumber())
			.company(admin.getCompany()) // 관리자와 같은 회사로 연결
			.role(UserRole.ROLE_TEMP_MEMBER) // 지갑 연결 안된 사용자
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
