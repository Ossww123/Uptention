package com.otoki.uptention.application.mining.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.otoki.uptention.application.mining.dto.request.FocusModeOnRequestDto;
import com.otoki.uptention.application.mining.dto.response.MiningTimeResponseDto;
import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;

public interface MiningTimeAppService {

	void focusModeOn(FocusModeOnRequestDto focusModeOnRequestDto);

	void focusModeOff();

	void executeDailyMiningProcesses();

	void executeWeeklyNftProcesses();

	List<MiningTimeResponseDto> findAllMiningTimes(Integer userId, LocalDateTime startTime, LocalDateTime endTime, String zoneId);

	Map<String, List<MiningTimeRankResponseDto>> findMiningRank(Integer top, String zoneId);
}
