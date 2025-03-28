package com.otoki.uptention.domain.user.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.repository.UserRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;

	@Override
	public User getUserById(Integer id) {
		return userRepository.findById(id)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
	}

	// username 중복 검증 메서드
	@Override
	public void validateDuplicateUsername(String username) {
		if (userRepository.existsByUsername(username)) {
			throw new CustomException(ErrorCode.AUTH_DUPLICATE_USERNAME);
		}
	}

	// 사번 중복 검증 메서드
	@Override
	public void validateDuplicateEmployeeNumber(String employeeNumber) {
		if (userRepository.existsByEmployeeNumber(employeeNumber)) {
			throw new CustomException(ErrorCode.AUTH_DUPLICATE_EMPLOYEE_NUMBER);
		}
	}
}
