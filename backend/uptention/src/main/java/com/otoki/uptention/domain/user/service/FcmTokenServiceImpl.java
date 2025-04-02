package com.otoki.uptention.domain.user.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.user.entity.FcmToken;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.repository.FcmTokenRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) //부르는 계층이 App Service 가 아닌, Filter 이므로 Transaction 관리를 여기서 해줘야 함.
public class FcmTokenServiceImpl implements FcmTokenService {
	private final FcmTokenRepository fcmTokenRepository;

	@Override
	@Transactional
	public void registerFcmToken(FcmToken fcmToken) {
		fcmTokenRepository.save(fcmToken);
	}

	@Transactional
	@Override
	public void removeFcmToken(User user, String value) {
		fcmTokenRepository.deleteByUserAndValue(user, value);
	}
}
