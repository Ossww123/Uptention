package com.otoki.uptention.application.notification.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.notification.dto.response.NotificationCountResponseDto;
import com.otoki.uptention.application.notification.dto.response.NotificationCursorResponseDto;
import com.otoki.uptention.application.notification.dto.response.NotificationResponseDto;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.notification.service.NotificationService;
import com.otoki.uptention.domain.user.entity.User;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Transactional(readOnly = true)
@Service
public class NotificationAppServiceImpl implements NotificationAppService {
	private final NotificationService notificationService;
	private final SecurityService securityService;

	// 알림 커서 조회
	@Override
	public NotificationCursorResponseDto getNotifications(Boolean read, String keyword, String cursorStr, int size) {
		User loggedInUser = securityService.getLoggedInUser();

		// 커서 디코딩
		CursorDto<String> cursor = CursorDto.decode(cursorStr, String.class);

		// size + 1개 조회하여 다음 페이지 존재 여부 확인
		List<Notification> notifications = notificationService.getNotificationsByCursor(
			loggedInUser, read, keyword, cursor, size + 1);

		boolean hasNextPage = notifications.size() > size;
		List<Notification> resultNotifications = hasNextPage ? notifications.subList(0, size) : notifications;

		// Entity를 DTO로 매핑
		List<NotificationResponseDto> notificationResponseDtos = resultNotifications.stream()
			.map(this::mapToDto)
			.collect(Collectors.toList());

		// 다음 커서 생성 (마지막 Notification 기준)
		String nextCursor = (hasNextPage && !resultNotifications.isEmpty())
			? createNextCursor(resultNotifications.get(resultNotifications.size() - 1))
			: null;

		return NotificationCursorResponseDto.builder()
			.notifications(notificationResponseDtos)
			.hasNextPage(hasNextPage)
			.nextCursor(nextCursor)
			.build();
	}

	// 사용자의 모든 알림을 읽음 처리
	@Override
	@Transactional
	public void markAllAsRead() {
		User loggedInUser = securityService.getLoggedInUser();
		notificationService.markAllAsRead(loggedInUser);
	}

	@Override
	public NotificationCountResponseDto getNotificationCount(Boolean read) {
		User loggedInUser = securityService.getLoggedInUser();
		int count = notificationService.countByUserAndRead(loggedInUser, read);

		return NotificationCountResponseDto.builder()
			.count(count)
			.build();
	}

	// Entity를 DTO로 변환
	private NotificationResponseDto mapToDto(Notification notification) {
		return NotificationResponseDto.builder()
			.notificationId(notification.getId())
			.title(notification.getTitle())
			.message(notification.getMessage())
			.createdAt(notification.getCreatedAt())
			.build();
	}

	// 다음 커서 생성
	private String createNextCursor(Notification lastNotification) {
		String value = lastNotification.getCreatedAt().toString();
		return new CursorDto<>(value, lastNotification.getId()).encode();
	}
}
