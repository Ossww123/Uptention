package com.otoki.uptention.application.mining.service;

import java.time.ZonedDateTime;
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

	List<MiningTimeResponseDto> findAllMiningTimes(Integer userId, ZonedDateTime startTime, ZonedDateTime endTime);

	Map<String, List<MiningTimeRankResponseDto>> findMiningRank(Integer top, ZonedDateTime zoneTime);
}
