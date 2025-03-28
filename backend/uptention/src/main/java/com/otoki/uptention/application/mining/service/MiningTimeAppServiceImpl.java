package com.otoki.uptention.application.mining.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.service.MiningTimeService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

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

	@Transactional
	@Override
	public void focusModeOff(Integer userId) {
		User findUser = userService.getUserById(userId);

		// 1. 채굴 시간 조회
		MiningTime findMiningTime = miningTimeService.findMiningTime(findUser);

		// 2. 현재 시간 및 기준 시간 지정
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime standardTime = LocalDateTime.now().toLocalDate().atTime(23, 30);

		if (findMiningTime.getEndTime() != null) {
			throw new CustomException(ErrorCode.FOCUS_MODE_OFF_FAILED);
		}

		if (now.isAfter(standardTime)) {
			throw new CustomException(ErrorCode.FOCUS_MODE_INSPECTION);
		}

		findMiningTime.updateEndTime(now);
		miningTimeService.saveMiningTime(findMiningTime);
	}

}
