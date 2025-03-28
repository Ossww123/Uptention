package com.otoki.uptention.global.exception;

import java.io.IOException;

import org.springframework.web.filter.GenericFilterBean;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FilterExceptionHandler extends GenericFilterBean { // Filter 전역 처리기

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws
		IOException,
		ServletException {
		this.doFilter((HttpServletRequest)request, (HttpServletResponse)response, chain);
	}

	private void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws
		IOException,
		ServletException {
		try {
			chain.doFilter(request, response);
		} catch (CustomException e) {
			sendErrorResponse(request, response, e);
		} catch (Exception ex) {
			throw new RuntimeException(ex.getMessage());
		}
	}

	private void sendErrorResponse(HttpServletRequest request, HttpServletResponse response, CustomException e) throws
		IOException {
		ErrorCode errorCode = e.getErrorCode();
		response.setStatus(errorCode.getStatus().value());
		response.setContentType("application/json;charset=UTF-8");

		ErrorResponse.of(errorCode, request.getRequestURI());

		// ErrorResponse 객체 생성
		ErrorResponse errorResponse = ErrorResponse.of(errorCode, request.getRequestURI());

		// ObjectMapper를 사용해 JSON 문자열로 변환
		ObjectMapper mapper = new ObjectMapper();
		String json = mapper.writeValueAsString(errorResponse);

		// 응답 본문에 JSON 작성
		response.getWriter().write(json);
	}
}
