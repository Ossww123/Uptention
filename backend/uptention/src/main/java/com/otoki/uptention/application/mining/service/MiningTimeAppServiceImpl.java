package com.otoki.uptention.application.mining.service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.mining.service.dto.response.MiningTimeResponseDto;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;
import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.service.MiningTimeService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class MiningTimeAppServiceImpl implements MiningTimeAppService {

	private final MiningTimeService miningTimeService;
	private final SecurityService securityService;

	@Transactional
	@Override
	public void focusModeOn(Integer userId) {
		User loggedInUser = securityService.getLoggedInUser();

		if (!loggedInUser.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		// 1. 채굴시간 생성
		MiningTime miningTime = MiningTime.builder()
			.user(loggedInUser)
			.startTime(LocalDateTime.now())
			.endTime(null)
			.build();

		// 2. 채굴시간 저장
		miningTimeService.saveMiningTime(miningTime);
	}

	@Transactional
	@Override
	public void focusModeOff(Integer userId) {
		User loggedInUser = securityService.getLoggedInUser();

		if (!loggedInUser.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		// 1. 채굴 시간 조회
		MiningTime findMiningTime = miningTimeService.findMiningTime(loggedInUser);

		// 2. 현재 시간 및 기준 시간 지정
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime startInspectionTime = LocalDateTime.now().toLocalDate().atTime(14, 30);
		LocalDateTime endInspectionTime = LocalDateTime.now().toLocalDate().atTime(15, 00);

		if (now.isAfter(startInspectionTime) && now.isBefore(endInspectionTime)) {
			throw new CustomException(ErrorCode.FOCUS_MODE_INSPECTION);
		}

		findMiningTime.updateEndTime(now);
		miningTimeService.saveMiningTime(findMiningTime);
	}

	@Transactional
	@Override
	public int bulkUpdateMiningTime() {
		LocalDateTime endTime = LocalDate.now().atTime(14, 30);
		return miningTimeService.updateEndTimeForUnfinishedMining(endTime);
	}

	@Transactional
	@Override
	public int bulkUpdateUserPoints() {
		LocalDateTime inspectionDate = LocalDate.now().atTime(14, 30);
		return miningTimeService.calculatePoint(inspectionDate);
	}


	// 채굴 시간 조회
	@Override
	public List<MiningTimeResponseDto> findAllMiningTimes(Integer userId, LocalDateTime startTime, LocalDateTime endTime) {
		User loggedInUser = securityService.getLoggedInUser();

		if (!loggedInUser.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		if (endTime.isBefore(startTime)) {
			throw new CustomException(ErrorCode.INVALID_DATE_RANGE);
		}

		// KST에서 UTC로 변환
		ZoneId kstZone = ZoneId.of("Asia/Seoul");
		ZonedDateTime startKst = startTime.atZone(kstZone);
		ZonedDateTime endKst = endTime.atZone(kstZone);
		LocalDateTime startUtc = startKst.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
		LocalDateTime endUtc = endKst.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();

		return miningTimeService.findMiningTimesByUserIdAndTimeRange(userId, startUtc, endUtc)
			.stream()
			.map(miningTime -> MiningTimeResponseDto.builder()
				.startTime(miningTime.getStartTime())
				.endTime(miningTime.getEndTime())
				.totalTime(Duration.between(miningTime.getStartTime(), miningTime.getEndTime()).toMinutes())
				.build())
			.collect(Collectors.toList());
	}

	// 우수사원 랭킹 조회
	@Override
	public  Map<String, List<MiningTimeRankResponseDto>> findMiningRank(Integer top) {
		if (top == null || top <= 0) {
			throw new CustomException(ErrorCode.TOP_VARIABLE_ERROR);
		}

		ZoneId seoulZone = ZoneId.of("Asia/Seoul");
		ZonedDateTime nowKst = ZonedDateTime.now(seoulZone);

		// 지난주 월요일 00:00 (KST)
		ZonedDateTime lastWeekMonday = nowKst
			.minusWeeks(1)
			.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
			.truncatedTo(ChronoUnit.DAYS);

		// 지난주 일요일 23:59:59.999 (KST)
		ZonedDateTime lastWeekSunday = lastWeekMonday.plusDays(6).with(LocalTime.MAX);

		// UTC로 변환
		Instant startUtc = lastWeekMonday.toInstant();
		Instant endUtc = lastWeekSunday.toInstant();

		// LocalDateTime으로 변환
		LocalDateTime startTime = LocalDateTime.ofInstant(startUtc, ZoneOffset.UTC);
		LocalDateTime endTime = LocalDateTime.ofInstant(endUtc, ZoneOffset.UTC);

		// 채굴 랭킹 조회 (분 단위, 내림차순 정렬)
		List<MiningTimeRankResponseDto> miningRank = miningTimeService.findMiningRank(startTime, endTime);

		// 등수 그룹을 부여하기 위한 로직
		Map<Integer, List<MiningTimeRankResponseDto>> rankMap = new LinkedHashMap<>();
		int currentRank = 0;
		Long previousTotalTime = null;
		for (MiningTimeRankResponseDto dto : miningRank) {
			// 첫 항목이거나 이전 totalTime과 값이 다르면 새로운 등수 부여
			if (previousTotalTime == null || !dto.getTotalMiningMinutes().equals(previousTotalTime)) {
				currentRank = rankMap.size() + 1;
				// top 개수 이상의 등수는 제외
				if (currentRank > top) {
					break;
				}
			}

			rankMap.computeIfAbsent(currentRank, k -> new ArrayList<>()).add(dto);
			previousTotalTime = dto.getTotalMiningMinutes();
		}

		// JSON 형태에 맞게 키를 문자열로 변환
		Map<String, List<MiningTimeRankResponseDto>> result = new LinkedHashMap<>();
		for (Map.Entry<Integer, List<MiningTimeRankResponseDto>> entry : rankMap.entrySet()) {
			result.put(String.valueOf(entry.getKey()), entry.getValue());
		}
		return result;
	}
}
