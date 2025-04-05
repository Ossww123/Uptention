package com.otoki.uptention.application.notification.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Schema(description = "알림 목록 조회 DTO")
public class NotificationCursorResponseDto {
	@Schema(description = "알림 목록")
	private List<NotificationResponseDto> notifications;

	@Schema(description = "다음 페이지 존재 여부", example = "true")
	private boolean hasNextPage;

	@Schema(description = "다음 페이지 커서 값", example = "eyJ2YWx1ZSI6MTAwLCJpZCI6MX0=")
	private String nextCursor;
}
