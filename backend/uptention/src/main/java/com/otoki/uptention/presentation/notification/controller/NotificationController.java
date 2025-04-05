package com.otoki.uptention.presentation.notification.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.notification.dto.response.NotificationCountResponseDto;
import com.otoki.uptention.application.notification.dto.response.NotificationCursorResponseDto;
import com.otoki.uptention.application.notification.service.NotificationAppService;
import com.otoki.uptention.presentation.notification.doc.NotificationApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController implements NotificationApiDoc {
	private final NotificationAppService notificationAppService;

	/**
	 * 알림 목록 조회 (커서 페이지네이션)
	 */
	@GetMapping("")
	public ResponseEntity<NotificationCursorResponseDto> getNotifications(
		@RequestParam(required = false) String cursor,
		@RequestParam(defaultValue = "10") int size) {

		NotificationCursorResponseDto response = notificationAppService.getNotifications(null, null, cursor, size);
		return ResponseEntity.ok(response);
	}

	/**
	 * 읽지 않은 알림 개수 조회
	 */
	@GetMapping("/count")
	public ResponseEntity<NotificationCountResponseDto> getUnreadNotificationCount(
		@RequestParam(required = false, defaultValue = "false") Boolean read) {

		NotificationCountResponseDto response = notificationAppService.getNotificationCount(read);
		return ResponseEntity.ok(response);
	}

	/**
	 * 모든 알림 읽음 처리
	 */
	@PatchMapping("/read")
	public ResponseEntity<String> markAllNotificationsAsRead() {
		notificationAppService.markAllAsRead();
		return ResponseEntity.ok("모든 알림 읽음 처리 성공");
	}
}
