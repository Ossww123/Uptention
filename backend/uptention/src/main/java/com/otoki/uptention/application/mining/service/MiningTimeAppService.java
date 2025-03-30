package com.otoki.uptention.application.mining.service;

import java.time.LocalDateTime;
import java.util.List;

import com.otoki.uptention.domain.mining.entity.MiningTime;

public interface MiningTimeAppService {

	void focusModeOn(Integer userId);
	void focusModeOff(Integer userId);
	int bulkUpdateMiningTime();
	int bulkUpdateUserPoints();
	List<MiningTime> findAllMiningTimes(Integer userId, LocalDateTime startTime, LocalDateTime endTime);

}
