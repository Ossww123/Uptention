package com.otoki.uptention.infra.fcm.service;

import java.util.List;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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
	private final FcmInnerService fcmInnerService;

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
			// 각 호출이 별도의 비동기 작업으로 처리됨
			fcmInnerService.sendNotification(token.getValue(), title, body);
		}
	}
}
