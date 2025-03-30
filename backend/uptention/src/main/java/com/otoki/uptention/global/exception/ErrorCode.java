package com.otoki.uptention.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public enum ErrorCode {
	EXAMPLE_NOT_FOUND(HttpStatus.NOT_FOUND, "X001", "예제 에러 코드입니다"),
	INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "X002", "잘못된 파라미터가 전달되었습니다."),
	INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "X003", "서버 에러가 발생했습니다."),

	// AUTH 관련 에러
	EXPIRED_ACCESS_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_001", "액세스토큰이 만료되었거나 유효하지 않습니다."),
	NOT_AUTHENTICATED_USER(HttpStatus.UNAUTHORIZED, "AUTH_002", "인증 되지 않은 사용자입니다."),
	FORBIDDEN_USER(HttpStatus.FORBIDDEN, "AUTH_003", "해당 요청의 권한이 없습니다."),
	AUTH_FAILED_LOGIN(HttpStatus.UNAUTHORIZED, "AUTH_004", "아이디, 비밀번호가 일치하지 않습니다."),
	AUTH_DUPLICATE_EMPLOYEE_NUMBER(HttpStatus.CONFLICT, "AUTH_005", "사번이 이미 사용 중입니다."),
	AUTH_DUPLICATE_USERNAME(HttpStatus.CONFLICT, "AUTH_006", "아이디가 이미 사용중입니다."),
	
	// 아이템 관련 에러
	ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "ITEM_001", "상품이 존재하지 않습니다."),
	ITEM_INVALID_SORT_TYPE(HttpStatus.BAD_REQUEST, "ITEM_002", "지원하지 않는 정렬 방식입니다."),
	ITEM_CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "ITEM_003", "카테고리가 존재하지 않습니다."),
	ITEM_INSUFFICIENT_STOCK(HttpStatus.BAD_REQUEST, "ITEM_004", "재고가 부족한 상품이 있습니다."),
	ITEM_NO_STOCK_TO_DECREASE(HttpStatus.BAD_REQUEST, "ITEM_005", "차감할 재고 수량이 없습니다."),
	ITEM_PRICE_MISMATCH(HttpStatus.CONFLICT, "ITEM_006", "상품 가격이 변경되었습니다."),
	ITEM_UNAVAILABLE(HttpStatus.NOT_FOUND, "ITEM_007", "삭제된 상품 입니다."),
	ITEM_QUANTITY_MIN_REQUIRED(HttpStatus.BAD_REQUEST, "ITEM_008", "상품 수량은 1개 이상이어야 합니다."),
	ITEM_QUANTITY_MAX_EXCEEDED(HttpStatus.BAD_REQUEST, "ITEM_009", "상품 수량은 99개 이하여야 합니다."),

	// 주문 관련 에러
	ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_001", "주문이 존재하지 않습니다."),

	// 주문 상품 관련 에러
	ORDER_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_ITEM_001", "주문 상품이 존재하지 않습니다."),

	// 장바구니 관련 에러
	CART_NOT_FOUND(HttpStatus.NOT_FOUND, "CART_001", "장바구니가 존재하지 않습니다."),
	CART_EMPTY_IDS(HttpStatus.BAD_REQUEST, "CART_004", "장바구니 ID 목록은 필수입니다."),

	// 커서 관련 에러
	CURSOR_ENCODING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "CURSOR_001", "커서 인코딩에 실패했습니다."),
	CURSOR_DECODING_FAILED(HttpStatus.BAD_REQUEST, "CURSOR_002", "커서 디코딩에 실패했습니다."),
	CURSOR_INVALID_FORMAT(HttpStatus.BAD_REQUEST, "CURSOR_003", "유효하지 않은 커서 형식입니다."),

	// 사용자 관련 에러
	USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_001", "사용자를 찾을 수 없습니다."),

	// 파일 관련 에러
	FILE_EMPTY(HttpStatus.BAD_REQUEST, "FILE_001", "파일이 비어있습니다."),
	FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "FILE_002", "파일 크기가 너무 큽니다. 최대 허용 크기는 5MB 바이트 입니다."), // 5MB
	FILE_INVALID_NAME(HttpStatus.BAD_REQUEST, "FILE_003", "유효하지 않은 파일 이름입니다."),
	FILE_INVALID_EXTENSION(HttpStatus.BAD_REQUEST, "FILE_004", "허용되지 않은 파일 확장자입니다."),
	FILE_INVALID_MIME_TYPE(HttpStatus.BAD_REQUEST, "FILE_005", "허용되지 않은 MIME 타입입니다."),
	FILE_HEADER_ERROR(HttpStatus.BAD_REQUEST, "FILE_006", "파일 헤더 정보를 읽어오지 못했습니다."),
	FILE_INVALID_MAGIC(HttpStatus.BAD_REQUEST, "FILE_007", "파일의 매직 넘버가 확장자와 일치하지 않습니다."),
	FILE_VALIDATION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_008", "파일 검증 중 오류가 발생했습니다."),
	FILE_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_009", "파일 업로드 중 오류가 발생했습니다."),

	// 집중모드 관련 에러
	FOCUS_MODE_ON_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "FOCUS_001", "집중모드 실행 중 오류가 발생했습니다."),
	FOCUS_MODE_OFF_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "FOCUS_002", "집중모드 종료 중 오류가 발생했습니다."),
	FOCUS_MODE_INSPECTION(HttpStatus.INTERNAL_SERVER_ERROR, "FOCUS_003", "포인트 정산 중입니다.");

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
