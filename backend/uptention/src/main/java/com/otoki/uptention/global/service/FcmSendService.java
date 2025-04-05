package com.otoki.uptention.global.service;

import java.util.List;

import com.otoki.uptention.domain.user.entity.User;

public interface FcmSendService {
	String sendNotification(String fcmToken, String title, String body);

	List<String> sendNotificationToUser(User user, String title, String body);
}
