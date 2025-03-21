package com.otoki.uptention.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public enum ErrorCode {
	EXAMPLE_NOT_FOUND(HttpStatus.NOT_FOUND, "X001", "예제 에러 코드입니다"),
	INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "X002", "잘못된 파라미터가 전달되었습니다."),
	INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "X003", "서버 에러가 발생했습니다."),

	// 아이템 관련 에러
	ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "ITEM_001", "상품이 존재하지 않습니다."),
	ITEM_INVALID_SORT_TYPE(HttpStatus.BAD_REQUEST, "ITEM_002", "지원하지 않는 정렬 방식입니다."),
	ITEM_CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "ITEM_003", "카테고리가 존재하지 않습니다."),

	// 커서 관련 에러
	CURSOR_ENCODING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "CURSOR_001", "커서 인코딩에 실패했습니다."),
	CURSOR_DECODING_FAILED(HttpStatus.BAD_REQUEST, "CURSOR_002", "커서 디코딩에 실패했습니다."),
	CURSOR_INVALID_FORMAT(HttpStatus.BAD_REQUEST, "CURSOR_003", "유효하지 않은 커서 형식입니다.");

	// http 상태 코드
	private final HttpStatus status;
	// 커스텀 에러 코드
	private final String code;
	// 기본 에러 메시지
	private final String defaultMessage;

	ErrorCode(HttpStatus status, String code, String defaultMessage) {
		this.status = status;
		this.code = code;
		this.defaultMessage = defaultMessage;
	}
}
