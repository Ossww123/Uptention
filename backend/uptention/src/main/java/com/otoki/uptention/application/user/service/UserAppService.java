package com.otoki.uptention.application.user.service;

import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;
import com.otoki.uptention.application.user.dto.response.UserCursorResponseDto;
import com.otoki.uptention.application.user.dto.response.UserResponseDto;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;

public interface UserAppService {
	void joinMember(JoinRequestDto requestDto);

	void checkDuplicateUsername(String username);

	void checkDuplicateEmployeeNumber(String employeeNumber);

	ProfileImageResponseDto updateProfileImage(Integer userId, MultipartFile profileImage);

	ProfileImageResponseDto removeProfileImage(Integer userId);

	UserResponseDto getUser(Integer userId);

	UserCursorResponseDto getUsers(UserRole userRole, String keyword, String cursorStr, UserSortType userSortType,
		int size);
}
