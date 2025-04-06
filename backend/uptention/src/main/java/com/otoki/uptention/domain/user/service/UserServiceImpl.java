package com.otoki.uptention.domain.user.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;
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

	@Override
	public User getUserByIdAndCompany(Integer id, Company company) {
		return userRepository.findByIdAndCompany(id, company)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
	}

	// 회원가입
	@Override
	public void join(User user) {
		// 중복 체크
		validateDuplicateUsername(user.getUsername());
		validateDuplicateEmployeeNumber(user.getEmployeeNumber());

		userRepository.save(user);
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

	@Override
	public List<User> getUsersByCursor(Company company, UserRole userRole, String keyword,
		CursorDto<String> cursor, UserSortType sortType, int size) {
		return userRepository.findUsersByCursor(company, userRole, keyword, cursor, sortType, size);
	}

	@Override
	public List<User> getUsersByRole() {
		return userRepository.findAllByRoleAndPointIsAfter(UserRole.ROLE_MEMBER, 0);
	}
}
