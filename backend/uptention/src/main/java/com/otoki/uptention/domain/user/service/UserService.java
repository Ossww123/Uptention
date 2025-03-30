package com.otoki.uptention.domain.user.service;

import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.user.entity.User;

public interface UserService {

	User getUserById(Integer id);

	User getUserByIdAndCompany(Integer id, Company company);

	// 회원가입
	void join(User user);

	// username 중복 검증 메서드
	void validateDuplicateUsername(String username);

	// 사번 중복 검증 메서드
	void validateDuplicateEmployeeNumber(String employeeNumber);
}
