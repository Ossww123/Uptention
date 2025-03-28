package com.otoki.uptention.application.user.service;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;

public interface UserAppService {
	void joinUser(JoinRequestDto requestDto);

	void checkDuplicateUsername(String username);

	void checkDuplicateEmployeeNumber(String employeeNumber);
}
