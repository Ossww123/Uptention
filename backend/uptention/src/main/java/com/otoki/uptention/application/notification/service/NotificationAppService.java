package com.otoki.uptention.application.notification.service;

import com.otoki.uptention.application.notification.dto.response.NotificationCountResponseDto;
import com.otoki.uptention.application.notification.dto.response.NotificationCursorResponseDto;

public interface NotificationAppService {

	// 커서 기반 알림 목록 조회
	NotificationCursorResponseDto getNotifications(Boolean read, String keyword, String cursorStr, int size);

	// 사용자의 모든 알림 읽음 처리
	void markAllAsRead();

	// 알림 개수 조회 (default = false)
	NotificationCountResponseDto getNotificationCount(Boolean read);
}
