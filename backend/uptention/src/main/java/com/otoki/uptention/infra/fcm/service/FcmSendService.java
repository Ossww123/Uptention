package com.otoki.uptention.infra.fcm.service;

import com.otoki.uptention.domain.user.entity.User;

public interface FcmSendService {
	// 사용자의 모든 기기에 알림 전송 메서드 (비동기 방식)
	void sendNotificationToUser(User user, String title, String body);
}
