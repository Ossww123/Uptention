package com.otoki.uptention.global.service;

import org.springframework.stereotype.Service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;

@Service
public class FcmSendServiceImpl implements FcmSendService {
	/**
	 * 특정 사용자에게 푸시 알림을 전송합니다.
	 *
	 * @param fcmToken 클라이언트 기기의 FCM 토큰
	 * @param title    알림 제목
	 * @param body     알림 내용
	 * @return 전송 요청 후, Firebase에서 반환하는 메시지 ID
	 * @throws Exception 전송 실패 시 예외 발생
	 */
	@Override
	public String sendNotification(String fcmToken, String title, String body) throws Exception {
		// 전송할 메시지 생성: 알림(Notification) 구성 및 대상(Firebase Token) 지정
		Message message = Message.builder()
			.setToken(fcmToken)
			.setNotification(Notification.builder()
				.setTitle(title)
				.setBody(body)
				.build())
			.build();

		// FirebaseMessaging 인스턴스를 사용하여 메시지 전송
		String response = FirebaseMessaging.getInstance().send(message);
		System.out.println("Successfully sent message: " + response);
		return response;
	}
}
