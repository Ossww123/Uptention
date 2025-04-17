package com.otoki.uptention.infra.fcm.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class FcmInnerServiceImpl implements FcmInnerService {

	@Override
	@Async("fcmTaskExecutor")
	public void sendNotification(String fcmToken, String title, String body) {
		try {
			Message message = Message.builder()
				.setToken(fcmToken)
				.setNotification(Notification.builder()
					.setTitle(title)
					.setBody(body)
					.build())
				.build();
			String messageId = FirebaseMessaging.getInstance().send(message);
			log.info("Async: Successfully sent message with ID: {}", messageId);
		} catch (Exception e) {
			log.error("Async: Failed to send FCM notification: {}", e.getMessage());
		}
	}
}
