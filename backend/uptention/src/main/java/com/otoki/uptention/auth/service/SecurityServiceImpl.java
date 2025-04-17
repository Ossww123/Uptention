package com.otoki.uptention.auth.service;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.otoki.uptention.auth.dto.CustomUserDetails;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.repository.UserRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class SecurityServiceImpl implements SecurityService {
	private final UserRepository userRepository;

	// 현재 사용자가 로그인되어 있는지 확인
	@Override
	public boolean isLoggedIn() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return authentication != null && authentication.isAuthenticated()
			&& !(authentication instanceof AnonymousAuthenticationToken);
	}

	// 현재 로그인한 사용자 반환
	@Override
	public User getLoggedInUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication == null || !authentication.isAuthenticated()
			|| authentication instanceof AnonymousAuthenticationToken) {
			throw new CustomException(ErrorCode.NOT_AUTHENTICATED_USER);
		}

		CustomUserDetails userDetails = (CustomUserDetails)authentication.getPrincipal();
		Integer userId = userDetails.getUserId();

		return userRepository.findById(userId)
			.orElseThrow(() -> new CustomException(ErrorCode.NOT_AUTHENTICATED_USER));
	}
}
