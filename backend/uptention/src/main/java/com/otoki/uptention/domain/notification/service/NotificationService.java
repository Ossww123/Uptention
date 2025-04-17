package com.otoki.uptention.domain.notification.service;

import java.util.List;

import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.user.entity.User;

public interface NotificationService {
	// 알림 저장
	void saveNotification(Notification notification);

	// 유저의 모든 알림 읽음 처리
	void markAllAsRead(User user);

	// 커서 기반 알림 조회
	List<Notification> getNotificationsByCursor(User user, Boolean read, String keyword,
		CursorDto<String> cursor, int size);

	// 유저의 알림 개수 조회 (읽음 상태별)
	int countByUserAndRead(User user, Boolean read);
}
