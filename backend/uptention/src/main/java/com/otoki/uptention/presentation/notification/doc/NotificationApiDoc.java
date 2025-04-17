package com.otoki.uptention.presentation.notification.doc;

import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.RequestParam;

import com.otoki.uptention.application.notification.dto.response.NotificationCountResponseDto;
import com.otoki.uptention.application.notification.dto.response.NotificationCursorResponseDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "알림 API", description = "알림 조회 및 읽음 처리 API")
public interface NotificationApiDoc {

	@Operation(
		summary = "알림 목록 조회",
		description = "커서 기반으로 알림 정보를 페이징 조회합니다. "
			+ "커서와 페이지 크기(size)를 전달받으며, "
			+ "로그인한 사용자의 알림만 조회됩니다. "
			+ "알림은 생성일 기준 최신순(내림차순)으로 정렬됩니다."
	)
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "알림 목록 조회 성공",
			content = @Content(
				schema = @Schema(implementation = NotificationCursorResponseDto.class),
				examples = {
					@ExampleObject(
						value = "{\"notifications\":[{\"notificationId\":1,\"title\":\"새로운 알림\",\"message\":\"새로운 알림이 도착했습니다.\",\"read\":false,\"createdAt\":\"2025-03-30T12:00:00\"}],\"hasNextPage\":true,\"nextCursor\":\"eyJ2YWx1ZSI6IjIwMjUtMDMtMzBUMTI6MDA6MDAiLCJpZCI6MX0=\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "잘못된 요청",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "CURSOR_DECODING_FAILED",
						value = "{\"code\":\"CURSOR_002\",\"message\":\"커서 디코딩에 실패했습니다.\",\"path\":\"/api/notifications\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "500",
			description = "서버 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "CURSOR_ENCODING_FAILED",
						value = "{\"code\":\"CURSOR_001\",\"message\":\"커서 인코딩에 실패했습니다.\",\"path\":\"/api/notifications\"}"
					)
				}
			)
		)
	})
	ResponseEntity<NotificationCursorResponseDto> getNotifications(
		@Parameter(
			description = "커서 문자열 (Base64 인코딩된 JSON)",
			example = "eyJ2YWx1ZSI6IjIwMjUtMDMtMzBUMTI6MDA6MDAiLCJpZCI6MX0="
		)
		@RequestParam(required = false) String cursor,

		@Parameter(
			description = "한 페이지 당 조회할 알림 수",
			example = "10"
		)
		@RequestParam(defaultValue = "10") int size
	);

	@Operation(
		summary = "읽지 않은 알림 개수 조회",
		description = "로그인한 사용자의 읽지 않은 알림 개수를 조회합니다. read 파라미터를 통해 읽은 알림 또는 읽지 않은 알림 개수를 선택적으로 조회할 수 있습니다."
	)
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "알림 개수 조회 성공",
			content = @Content(
				schema = @Schema(implementation = NotificationCountResponseDto.class),
				examples = {
					@ExampleObject(
						value = "{\"count\":5}"
					)
				}
			)
		)
	})
	ResponseEntity<NotificationCountResponseDto> getUnreadNotificationCount(
		@Parameter(
			description = "읽음 상태 (true: 읽은 알림, false: 읽지 않은 알림)",
			example = "false"
		)
		@RequestParam(required = false, defaultValue = "false") Boolean read
	);

	@Operation(
		summary = "모든 알림 읽음 처리",
		description = "로그인한 사용자의 모든 읽지 않은 알림을 읽음 처리합니다."
	)
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "모든 알림 읽음 처리 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(
						value = "\"모든 알림 읽음 처리 성공\""
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "500",
			description = "서버 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						value = "{\"code\":\"INTERNAL_SERVER_ERROR\",\"message\":\"서버 내부 오류가 발생했습니다.\",\"path\":\"/api/notifications/read\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> markAllNotificationsAsRead();
}