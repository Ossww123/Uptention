package com.otoki.uptention.domain.notification.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.notification.repository.NotificationRepository;
import com.otoki.uptention.domain.user.entity.User;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class NotificationServiceImpl implements NotificationService {
	private final NotificationRepository notificationRepository;

	@Override
	public void saveNotification(Notification notification) {
		notificationRepository.save(notification);
	}

	@Override
	public void markAllAsRead(User user) {
		notificationRepository.markAllAsReadByUser(user);
	}

	@Override
	public List<Notification> getNotificationsByCursor(User user, Boolean read, String keyword,
		CursorDto<String> cursor, int size) {
		return notificationRepository.findNotificationsByCursor(user, read, keyword, cursor, size);
	}

	@Override
	public int countByUserAndRead(User user, Boolean read) {
		return notificationRepository.countByUserAndRead(user, read);
	}
}
