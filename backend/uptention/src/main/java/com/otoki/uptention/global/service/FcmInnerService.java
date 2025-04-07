package com.otoki.uptention.global.service;

public interface FcmInnerService {
	void sendNotification(String fcmToken, String title, String body);
}
