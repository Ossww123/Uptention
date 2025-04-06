package com.otoki.uptention.global.service;

import java.util.List;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.otoki.uptention.domain.user.entity.FcmToken;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.repository.FcmTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class FcmSendServiceImpl implements FcmSendService {
	private final FcmTokenRepository fcmTokenRepository;

	/**
	 * @param fcmToken 클라이언트 기기의 FCM 토큰
	 * @param title    알림 제목
	 * @param body     알림 내용
	 */
	@Async("fcmTaskExecutor")
	public void sendNotification(String fcmToken, String title, String body) {
		try {
			// 전송할 메시지 생성
			Message message = Message.builder()
				.setToken(fcmToken)
				.setNotification(Notification.builder()
					.setTitle(title)
					.setBody(body)
					.build())
				.build();

			// 메시지 전송 및 결과 로깅
			log.info("Async: Sending notification to FCM - Title: {}, Body: {}", title, body);
			String messageId = FirebaseMessaging.getInstance().send(message);
			log.info("Async: Successfully sent message with ID: {}", messageId);
		} catch (Exception e) {
			log.error("Async: Failed to send FCM notification to token {}: {}", fcmToken, e.getMessage());
		}
	}

	/**
	 * 특정 사용자의 모든 기기에 푸시 알림을 비동기로 전송합니다.
	 *
	 * @param user  알림을 받을 사용자
	 * @param title 알림 제목
	 * @param body  알림 내용
	 */
	@Async("fcmTaskExecutor")
	public void sendNotificationToUser(User user, String title, String body) {
		List<FcmToken> fcmTokens = fcmTokenRepository.findAllByUser(user);

		if (fcmTokens.isEmpty()) {
			log.warn("Async: User {} has no registered FCM tokens", user.getId());
			return;
		}

		for (FcmToken token : fcmTokens) {
			sendNotification(token.getValue(), title, body);
		}
	}
}