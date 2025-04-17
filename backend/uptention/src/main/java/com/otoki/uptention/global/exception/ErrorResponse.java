package com.otoki.uptention.global.exception;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ErrorResponse {
	private String code;

	private String message;

	private String path;

	public static ErrorResponse of(ErrorCode errorCode, String message, String path) {
		return ErrorResponse.builder()
			.code(errorCode.getCode())
			.message(message)
			.path(path)
			.build();
	}

	public static ErrorResponse of(ErrorCode errorCode, String path) {
		return ErrorResponse.builder()
			.code(errorCode.getCode())
			.message(errorCode.getDefaultMessage())
			.path(path)
			.build();
	}
}
