package com.otoki.uptention.auth.filter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Iterator;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StreamUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.otoki.uptention.auth.dto.CustomUserDetails;
import com.otoki.uptention.auth.dto.LoginRequestDto;
import com.otoki.uptention.auth.service.AccessTokenService;
import com.otoki.uptention.auth.service.CustomAuthenticationToken;
import com.otoki.uptention.domain.user.entity.FcmToken;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.FcmTokenService;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class LoginFilter extends UsernamePasswordAuthenticationFilter {
	private static final ObjectMapper objectMapper = new ObjectMapper();
	private final AuthenticationManager authenticationManager;
	private final AccessTokenService accessTokenService;
	private final FcmTokenService fcmTokenService;
	private final UserService userService;

	public LoginFilter(AuthenticationManager authenticationManager, AccessTokenService accessTokenService,
		FcmTokenService fcmTokenService, UserService userService) {
		super(authenticationManager);
		this.authenticationManager = authenticationManager;
		this.accessTokenService = accessTokenService;
		this.fcmTokenService = fcmTokenService;
		this.userService = userService;
	}

	@Override
	public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws
		AuthenticationException {
		LoginRequestDto loginRequestDTO = parseLoginRequest(request);

		String username = loginRequestDTO.getUsername();
		String password = loginRequestDTO.getPassword();
		String loginType = loginRequestDTO.getLoginType();

		CustomAuthenticationToken authToken = new CustomAuthenticationToken(username, password, loginType);

		return authenticationManager.authenticate(authToken);
	}

	@Override
	protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
		Authentication authentication) {
		String username = authentication.getName();

		// CustomUserDetails로 캐스팅해서 추가 정보를 가져올 수 있음
		CustomUserDetails customUserDetails = (CustomUserDetails)authentication.getPrincipal();
		Integer userId = customUserDetails.getUserId();

		Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
		Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
		GrantedAuthority auth = iterator.next();
		String role = auth.getAuthority();

		// ROLE_MEMBER 의 경우만 FcmToken 존재 (모바일이므로)
		if (role.equals("ROLE_MEMBER")) {
			String tokenValue = request.getHeader("FCM-Token");

			if (tokenValue == null || tokenValue.isEmpty()) {
				throw new CustomException(ErrorCode.AUTH_BAD_REQUEST_FCM);
			}

			User user = userService.getUserById(userId);

			FcmToken fcmToken = FcmToken.builder()
				.value(tokenValue)
				.user(user)
				.build();

			// FcmToken 저장
			fcmTokenService.registerFcmToekn(fcmToken);
		}

		// AccessToken 발행
		accessTokenService.issueToken(response, userId, role);

		// 응답 본문에 JSON 메시지 작성
		response.setContentType("application/json;charset=UTF-8");
		response.setStatus(HttpServletResponse.SC_OK);

		try {
			// JSON 포맷으로 메시지 작성
			String jsonResponse = "{\"message\":\"로그인 성공\"}";
			response.getWriter().write(jsonResponse);
			response.getWriter().flush();
		} catch (Exception e) {
			logger.error(e.getMessage());
		}
	}

	@Override
	protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
		AuthenticationException failed) {
		if (failed instanceof AuthenticationServiceException) {
			throw new CustomException(ErrorCode.INVALID_PARAMETER);
		}

		throw new CustomException(ErrorCode.AUTH_FAILED_LOGIN);
	}

	private LoginRequestDto parseLoginRequest(HttpServletRequest request) {
		try {
			ServletInputStream inputStream = request.getInputStream();
			String messageBody = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);

			return objectMapper.readValue(messageBody, LoginRequestDto.class);
		} catch (IOException e) {
			throw new AuthenticationServiceException(ErrorCode.INVALID_PARAMETER.getDefaultMessage());
		}
	}
}
