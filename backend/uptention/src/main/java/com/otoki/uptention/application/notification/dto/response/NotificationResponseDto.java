package com.otoki.uptention.application.notification.dto.response;

import java.time.LocalDateTime;

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
@Schema(description = "알림 DTO")
public class NotificationResponseDto {
	@Schema(description = "알림 ID")
	private Integer notificationId;

	@Schema(description = "알림 제목")
	private String title;

	@Schema(description = "메시지")
	private String message;

	@Schema(description = "생성일자")
	private LocalDateTime createdAt;
}
