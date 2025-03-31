package com.otoki.uptention.domain.mining.service;

import java.time.LocalDateTime;
import java.util.List;

import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;
import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.user.entity.User;

public interface MiningTimeService {

	void saveMiningTime(MiningTime miningTime);
	MiningTime findMiningTime(User user);
	int updateEndTimeForUnfinishedMining(LocalDateTime endTime);
	int calculatePoint(LocalDateTime inspectionTime);
	List<MiningTime> findMiningTimesByUserIdAndTimeRange(Integer userId, LocalDateTime startTime, LocalDateTime endTime);
	List<MiningTimeRankResponseDto> findMiningRank(LocalDateTime startTime, LocalDateTime endTime);
}
