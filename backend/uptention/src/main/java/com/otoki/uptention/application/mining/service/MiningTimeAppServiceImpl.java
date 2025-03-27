package com.otoki.uptention.application.mining.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.service.MiningTimeService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class MiningTimeAppServiceImpl implements MiningTimeAppService {

	private final MiningTimeService miningTimeService;
	private final UserService userService;

	@Transactional
	@Override
	public void focusModeOn(Integer userId) {
		// security 구현 후, 코드 수정 필요
		User findUser = userService.getUserById(userId);

		// 1. 채굴시간 생성
		MiningTime miningTime = MiningTime.builder()
			.user(findUser)
			.startTime(LocalDateTime.now())
			.endTime(null)
			.build();

		// 2. 채굴시간 저장
		miningTimeService.saveMiningTime(miningTime);
	}
}
