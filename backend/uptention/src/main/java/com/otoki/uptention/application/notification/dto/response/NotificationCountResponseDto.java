package com.otoki.uptention.application.notification.dto.response;

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
@Schema(description = "안읽음 알림 갯수 DTO")
public class NotificationCountResponseDto {
	@Schema(description = "안읽음 알림 갯수")
	private Integer count;
}
