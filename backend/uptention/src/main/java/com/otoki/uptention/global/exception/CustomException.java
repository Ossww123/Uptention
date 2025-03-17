package com.otoki.uptention.global.exception;

import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {
	private final ErrorCode errorCode;

	/**
	 * ErrorCode의 defaultMessage를 기본 메시지로 사용
	 */
	public CustomException(ErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}
}

