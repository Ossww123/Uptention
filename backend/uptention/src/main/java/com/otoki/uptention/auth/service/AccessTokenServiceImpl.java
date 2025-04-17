package com.otoki.uptention.auth.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.auth.constant.JWTConstants;
import com.otoki.uptention.auth.util.JWTUtil;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccessTokenServiceImpl implements AccessTokenService {
	private final JWTUtil jwtUtil;

	// AccessToken 발급
	@Override
	public void issueToken(HttpServletResponse response, Integer userId, String role) {
		String accessToken = jwtUtil.createJwt(JWTConstants.ACCESS_TOKEN, userId, role,
			JWTConstants.ACCESS_TOKEN_EXPIRATION_TIME_MS); // AccessToken 만료시간 30일

		response.setHeader(JWTConstants.ACCESS_TOKEN, JWTConstants.PREFIX_JWT + accessToken);
	}
}
