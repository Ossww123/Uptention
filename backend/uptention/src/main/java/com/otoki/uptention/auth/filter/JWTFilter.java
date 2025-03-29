package com.otoki.uptention.auth.filter;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.otoki.uptention.auth.constant.JWTConstants;
import com.otoki.uptention.auth.dto.CustomUserDetails;
import com.otoki.uptention.auth.dto.UserDetailsDto;
import com.otoki.uptention.auth.util.JWTUtil;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Component
public class JWTFilter extends OncePerRequestFilter {

	private final JWTUtil jwtUtil;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
		FilterChain filterChain) throws ServletException, IOException {

		String authorization = request.getHeader(JWTConstants.ACCESS_TOKEN);

		if (authorization == null || !authorization.startsWith(JWTConstants.PREFIX_JWT)) {
			filterChain.doFilter(request, response);
			return;
		}

		String[] parts = authorization.split(" ");
		if (parts.length != 2) {
			// 잘못된 포맷의 토큰인 경우, BAD_REQUEST (400) 에러를 반환
			throw new CustomException(ErrorCode.INVALID_PARAMETER);
		}

		String accessToken = parts[1];

		jwtUtil.validateAccessToken(accessToken);

		Integer userId = jwtUtil.getUserId(accessToken);
		String role = jwtUtil.getRole(accessToken);
		UserDetailsDto userDetailsDTO = UserDetailsDto.builder()
			.userId(userId)
			.role(UserRole.valueOf(role))
			.build();

		CustomUserDetails customUserDetails = new CustomUserDetails(userDetailsDTO);
		Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null,
			customUserDetails.getAuthorities());
		SecurityContextHolder.getContext().setAuthentication(authToken);

		filterChain.doFilter(request, response);
	}
}
