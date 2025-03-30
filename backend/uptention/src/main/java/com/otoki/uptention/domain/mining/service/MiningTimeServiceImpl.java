package com.otoki.uptention.domain.mining.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.repository.MiningTimeRepository;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MiningTimeServiceImpl implements MiningTimeService {

	private final MiningTimeRepository miningTimeRepository;

	@Override
	public void saveMiningTime(MiningTime miningTime) {
		// 채굴시간 저장
		miningTimeRepository.save(miningTime);
	}

	@Override
	public MiningTime findMiningTime(User user) {
		return miningTimeRepository.findTopByUserOrderByStartTimeDesc(user)
			.filter(mt -> mt.getEndTime() == null) // 종료시간이 null 아닌 경우 에러 발생
			.orElseThrow(() -> new CustomException(ErrorCode.FOCUS_MODE_OFF_FAILED));
	}

	@Override
	public int updateEndTimeForUnfinishedMining(LocalDateTime endTime) {
		return miningTimeRepository.updateEndTimeForUnfinishedMining(endTime);
	}

	@Override
	public int calculatePoint(LocalDateTime inspectionTime) {
		return miningTimeRepository.updateUserPoints(inspectionTime);
	}
}
