package com.otoki.uptention.global.exception;

import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	/**
	 * 커스텀 예외 처리
	 */
	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ErrorResponse> handleCustomException(CustomException ex, HttpServletRequest request) {
		ErrorCode errorCode = ex.getErrorCode();

		return ResponseEntity.status(errorCode.getStatus())
			.body(ErrorResponse.of(errorCode, request.getRequestURI()));
	}

	/**
	 * 유효성 검증 실패 예외 (MethodArgumentNotValidException 등), Request 시 인자 검증
	 * */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
		MethodArgumentNotValidException ex,
		HttpServletRequest request
	) {
		// FieldError를 전부 모아서, 각각 "필드명: 에러메시지" 형태로 변환한 뒤
		// 쉼표(혹은 세미콜론 등)로 구분하여 하나의 문자열로 합칩니다.
		String errorMessage = ex.getBindingResult().getFieldErrors().stream()
			.map(fieldError -> String.format("[%s] %s",
				fieldError.getField(),
				fieldError.getDefaultMessage()))
			.collect(Collectors.joining("; "));

		logger.error("유효성 검증 실패: {}, 요청 URI: {}", errorMessage, request.getRequestURI(), ex);

		// ErrorCode를 고정으로 사용
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ErrorResponse.of(ErrorCode.INVALID_PARAMETER, errorMessage, request.getRequestURI()));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(
		MaxUploadSizeExceededException ex,
		HttpServletRequest request
	) {
		String errorMessage = "업로드 파일 크기가 제한을 초과했습니다.";
		logger.error("파일 크기 초과: {}, 요청 URI: {}", errorMessage, request.getRequestURI(), ex);

		// 여기서 에러 코드와 상태를 필요에 따라 선택합니다.
		// 예를 들어, 400 Bad Request 또는 413 Payload Too Large
		return ResponseEntity.status(ErrorCode.FILE_TOO_LARGE.getStatus())
			.body(ErrorResponse.of(ErrorCode.FILE_TOO_LARGE, request.getRequestURI()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleException(Exception ex, HttpServletRequest request) {
		logger.error("서버 내부 오류 발생: {}, 요청 URI: {}", ex.getMessage(), request.getRequestURI(), ex);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR, request.getRequestURI()));
	}
}
