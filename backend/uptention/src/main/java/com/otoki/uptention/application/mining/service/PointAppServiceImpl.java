package com.otoki.uptention.application.mining.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.application.mining.service.dto.response.PointResponseDto;
import com.otoki.uptention.domain.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PointAppServiceImpl implements PointAppService {

	private final UserService userService;

	@Override
	public PointResponseDto getPoint() {
		return PointResponseDto.builder()
			.point(userService.getUserById(1).getPoint())
			.build();
	}
}
