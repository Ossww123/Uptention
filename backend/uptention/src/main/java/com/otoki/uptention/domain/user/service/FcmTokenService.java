package com.otoki.uptention.domain.user.service;

import com.otoki.uptention.domain.user.entity.FcmToken;
import com.otoki.uptention.domain.user.entity.User;

public interface FcmTokenService {
	void registerFcmToken(FcmToken fcmToken);

	void removeFcmToken(User user, String value);
}
