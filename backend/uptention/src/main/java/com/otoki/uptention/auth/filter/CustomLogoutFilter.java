package com.otoki.uptention.auth.filter;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean;

import com.otoki.uptention.auth.constant.JWTConstants;
import com.otoki.uptention.auth.util.JWTUtil;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.FcmTokenService;
import com.otoki.uptention.domain.user.service.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Component
@Slf4j
public class CustomLogoutFilter extends GenericFilterBean {
	private final UserService userService;
	private final JWTUtil jwtUtil;
	private final FcmTokenService fcmTokenService;

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain) throws
		IOException,
		ServletException {
		doFilter((HttpServletRequest)request, (HttpServletResponse)response, filterChain);
	}

	private void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws
		IOException,
		ServletException {
		String servletPath = request.getServletPath();
		String requestMethod = request.getMethod();

		if (!servletPath.equals("/api/logout") || !requestMethod.equals("POST")) {
			filterChain.doFilter(request, response);
			return;
		}

		try {
			// AccessToken 추출 및 검증
			String authorization = request.getHeader(JWTConstants.ACCESS_TOKEN);
			boolean hasValidAccessToken = authorization != null && authorization.startsWith("Bearer ");
			if (!hasValidAccessToken) {
				log.warn(
					"AccessToken header is missing or does not start with 'Bearer'. 인증 토큰이 없으므로 FCM 토큰 삭제를 건너뜁니다.");
			}
			if (hasValidAccessToken) {
				String accessToken = authorization.substring("Bearer ".length());
				jwtUtil.validateAccessToken(accessToken);
				Integer userId = jwtUtil.getUserId(accessToken);
				User user = userService.getUserById(userId);

				// FCM-Token 추출 및 삭제 (없어도 무시)
				String tokenValue = request.getHeader("FCM-Token");
				boolean hasValidFcmToken = tokenValue != null && !tokenValue.trim().isEmpty();
				if (!hasValidFcmToken) {
					log.warn("FCM-Token header is missing or empty. FCM 토큰 삭제를 건너뜁니다.");
				}
				if (hasValidFcmToken) {
					fcmTokenService.removeFcmToken(user, tokenValue);
				}
			}
		} catch (Exception e) {
			log.error("Exception during logout process: {}", e.getMessage());
		}

		// 응답 본문에 JSON 메시지 작성
		response.setContentType("application/json;charset=UTF-8");
		response.setStatus(HttpServletResponse.SC_OK);

		// JSON 포맷으로 메시지 작성
		String jsonResponse = "{\"message\":\"로그아웃 성공\"}";
		response.getWriter().write(jsonResponse);
		response.getWriter().flush();
	}
}
