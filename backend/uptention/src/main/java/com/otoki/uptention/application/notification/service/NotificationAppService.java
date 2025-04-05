package com.otoki.uptention.application.notification.service;

import com.otoki.uptention.application.notification.dto.response.NotificationCursorResponseDto;

public interface NotificationAppService {
	// 커서 기반 알림 목록 조회
	NotificationCursorResponseDto getNotifications(Boolean read, String keyword, String cursorStr, int size);
}
