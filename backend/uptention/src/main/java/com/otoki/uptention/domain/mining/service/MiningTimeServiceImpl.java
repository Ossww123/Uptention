package com.otoki.uptention.domain.mining.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;
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
		return miningTimeRepository.findTopByUserOrderByStartTimeDesc(user);
	}

	@Override
	public int updateEndTimeForUnfinishedMining(LocalDateTime endTime) {
		return miningTimeRepository.updateEndTimeForUnfinishedMining(endTime);
	}

	@Override
	public int calculatePoint(LocalDateTime inspectionTime) {
		return miningTimeRepository.updateUserPoints(inspectionTime);
	}

	@Override
	public List<MiningTime> findMiningTimesByUserIdAndTimeRange(Integer userId, LocalDateTime startTime,
		LocalDateTime endTime) {
		return miningTimeRepository.findMiningTimesByUserIdAndTimeRange(userId, startTime, endTime);
	}

	@Override
	public List<MiningTimeRankResponseDto> findMiningRank(LocalDateTime startTime,
		LocalDateTime endTime) {
		return miningTimeRepository.findMiningTimeRanking(startTime, endTime);
	}
}
