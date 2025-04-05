package com.otoki.uptention.domain.notification.repository;

import java.util.List;

import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.user.dto.UserCursorDto;
import com.otoki.uptention.domain.user.entity.User;

public interface NotificationRepositoryCustom {
	List<Notification> findNotificationsByCursor(User user, Boolean read, String keyword,
		UserCursorDto<String> cursor, int size);
}
