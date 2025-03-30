package com.otoki.uptention.application.mining.service;

import java.time.LocalDateTime;
import java.util.List;

import com.otoki.uptention.application.mining.service.dto.response.MiningTimeResponseDto;

public interface MiningTimeAppService {

	void focusModeOn(Integer userId);
	void focusModeOff(Integer userId);
	int bulkUpdateMiningTime();
	int bulkUpdateUserPoints();
	List<MiningTimeResponseDto> findAllMiningTimes(Integer userId, LocalDateTime startTime, LocalDateTime endTime);

}
