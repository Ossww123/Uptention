package com.otoki.uptention.global.service;

public interface FcmSendService {
	String sendNotification(String fcmToken, String title, String body) throws Exception;
}
