package com.otoki.uptention.auth.filter;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean;

import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.FcmTokenService;

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
	private final SecurityService securityService;
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
			User user = securityService.getLoggedInUser();
			String tokenValue = request.getHeader("FCM-Token");
			fcmTokenService.removeFcmToken(user, tokenValue);

			// 응답 본문에 JSON 메시지 작성
			response.setContentType("application/json;charset=UTF-8");
			response.setStatus(HttpServletResponse.SC_OK);

			// JSON 포맷으로 메시지 작성
			String jsonResponse = "{\"message\":\"로그아웃 성공\"}";
			response.getWriter().write(jsonResponse);
			response.getWriter().flush();
		} catch (Exception e) {
			log.error(e.getMessage());
		}
	}
}
