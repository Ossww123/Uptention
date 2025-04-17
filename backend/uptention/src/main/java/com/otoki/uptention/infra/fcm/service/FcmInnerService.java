package com.otoki.uptention.infra.fcm.service;

public interface FcmInnerService {
	void sendNotification(String fcmToken, String title, String body);
}
