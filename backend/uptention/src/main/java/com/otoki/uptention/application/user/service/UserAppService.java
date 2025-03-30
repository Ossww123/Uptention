package com.otoki.uptention.application.user.service;

import com.otoki.uptention.application.user.dto.response.PointResponseDto;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;

public interface UserAppService {
	void joinMember(JoinRequestDto requestDto);

	void checkDuplicateUsername(String username);

	void checkDuplicateEmployeeNumber(String employeeNumber);

	ProfileImageResponseDto updateProfileImage(Integer userId, MultipartFile profileImage);

	ProfileImageResponseDto removeProfileImage(Integer userId);
	
	PointResponseDto getUserPoints(Integer userId);
}
