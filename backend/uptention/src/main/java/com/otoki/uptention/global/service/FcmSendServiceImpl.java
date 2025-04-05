package com.otoki.uptention.global.service;

import java.util.ArrayList;
import java.util.List;

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
	 * 특정 사용자에게 푸시 알림을 전송합니다.
	 *
	 * @param fcmToken 클라이언트 기기의 FCM 토큰
	 * @param title    알림 제목
	 * @param body     알림 내용
	 * @return 전송 요청 후, Firebase에서 반환하는 메시지 ID, 실패 시 null 반환
	 */
	@Override
	public String sendNotification(String fcmToken, String title, String body) {
		try {
			// 전송할 메시지 생성: 알림(Notification) 구성 및 대상(Firebase Token) 지정
			Message message = Message.builder()
				.setToken(fcmToken)
				.setNotification(Notification.builder()
					.setTitle(title)
					.setBody(body)
					.build())
				.build();

			// FirebaseMessaging 인스턴스를 사용하여 메시지 전송
			log.info("Sending notification to FCM - Title: {}, Body: {}", title, body);
			return FirebaseMessaging.getInstance().send(message);
		} catch (Exception e) {
			log.error("Failed to send FCM notification to token {}: {}", fcmToken, e.getMessage());
			return null;
		}
	}

	/**
	 * 특정 사용자의 모든 기기에 푸시 알림을 전송합니다.
	 *
	 * @param user  알림을 받을 사용자
	 * @param title 알림 제목
	 * @param body  알림 내용
	 * @return 전송된 메시지 ID 목록
	 */
	@Override
	public List<String> sendNotificationToUser(User user, String title, String body) {
		List<String> messageIds = new ArrayList<>();
		List<FcmToken> fcmTokens = fcmTokenRepository.findAllByUser(user);

		if (fcmTokens.isEmpty()) {
			log.warn("User {} has no registered FCM tokens", user.getId());
			return messageIds;
		}

		for (FcmToken token : fcmTokens) {
			String messageId = sendNotification(token.getValue(), title, body);
			if (messageId != null) {
				messageIds.add(messageId);
				log.info("Successfully sent notification to user {} device, messageId: {}", user.getId(), messageId);
			}
		}

		return messageIds;
	}
}