package com.otoki.uptention.application.user.service;

import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.application.user.dto.request.UpdatePasswordRequestDto;
import com.otoki.uptention.application.user.dto.response.PointResponseDto;
import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;
import com.otoki.uptention.application.user.dto.response.UserCursorResponseDto;
import com.otoki.uptention.application.user.dto.response.UserResponseDto;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;

import jakarta.servlet.http.HttpServletResponse;

public interface UserAppService {
	void joinMember(JoinRequestDto requestDto);

	void checkDuplicateUsername(String username);

	void checkDuplicateEmployeeNumber(String employeeNumber);

	ProfileImageResponseDto updateProfileImage(Integer userId, MultipartFile profileImage);

	ProfileImageResponseDto removeProfileImage(Integer userId);

	PointResponseDto getUserPoints(Integer userId);

	UserResponseDto getUser(Integer userId);

	UserCursorResponseDto getUsers(UserRole userRole, String keyword, String cursorStr, UserSortType userSortType,
		int size);

	void removeUser(Integer userId);

	void updatePassword(Integer userId, UpdatePasswordRequestDto updatePasswordRequestDto);

	void connectWallet(HttpServletResponse response, Integer userId, String wallet);
}
