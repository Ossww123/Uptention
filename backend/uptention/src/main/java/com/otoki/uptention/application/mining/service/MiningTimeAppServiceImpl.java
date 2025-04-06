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
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.otoki.uptention.application.mining.dto.request.FocusModeOnRequestDto;
import com.otoki.uptention.application.mining.dto.response.MiningTimeResponseDto;
import com.otoki.uptention.application.user.service.UserAppService;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;
import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.service.MiningTimeService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.otoki.uptention.solana.service.ExpressApiService;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class MiningTimeAppServiceImpl implements MiningTimeAppService {

	private final UserService userService;
	private final MiningTimeService miningTimeService;
	private final SecurityService securityService;
	private final ExpressApiService expressApiService;
	private final UserAppService userAppService;
	private final ObjectMapper objectMapper;

	@Transactional
	@Override
	public void focusModeOn(FocusModeOnRequestDto focusModeOnRequestDto) {
		User loggedInUser = securityService.getLoggedInUser();
		Company company = loggedInUser.getCompany();

		Float companyLatitude = company.getLatitude();
		Float companyLongitude = company.getLongitude();

		float userLatitude = focusModeOnRequestDto.getLatitude();
		float userLongitude = focusModeOnRequestDto.getLongitude();

		boolean isWithin500m = isWithinRadius(companyLatitude, companyLongitude, userLatitude, userLongitude, 500.0);

		if (!isWithin500m) {
			throw new CustomException(ErrorCode.FOCUS_MODE_INVALID_RANGE);
		}

		MiningTime findMiningTime = miningTimeService.findMiningTime(loggedInUser);

		LocalDateTime now = LocalDateTime.now();
		if (findMiningTime != null && findMiningTime.getEndTime() == null) {
			findMiningTime.updateEndTime(now);
		}

		// 1. 채굴시간 생성
		MiningTime miningTime = MiningTime.builder()
			.user(loggedInUser)
			.startTime(now)
			.endTime(null)
			.build();

		// 2. 채굴시간 저장
		miningTimeService.saveMiningTime(miningTime);
	}

	@Transactional
	@Override
	public void focusModeOff() {
		User loggedInUser = securityService.getLoggedInUser();

		// 1. 채굴 시간 조회
		MiningTime findMiningTime = miningTimeService.findMiningTime(loggedInUser);

		if (findMiningTime == null || findMiningTime.getEndTime() != null) {
			throw new CustomException(ErrorCode.FOCUS_MODE_OFF_FAILED);
		}

		// 2. 현재 시간 및 기준 시간 지정
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime startInspectionTime = LocalDateTime.now().toLocalDate().atTime(14, 30);
		LocalDateTime endInspectionTime = LocalDateTime.now().toLocalDate().atTime(15, 00);

		if (now.isAfter(startInspectionTime) && now.isBefore(endInspectionTime)) {
			throw new CustomException(ErrorCode.FOCUS_MODE_INSPECTION);
		}

		findMiningTime.updateEndTime(now);

		LocalDateTime startTime = findMiningTime.getStartTime();
		LocalDateTime endTime = findMiningTime.getEndTime();

		long diffMinutes = Duration.between(startTime, endTime).toMinutes();

		loggedInUser.setPoint((int)(loggedInUser.getPoint() + diffMinutes));

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
	public List<MiningTimeResponseDto> findAllMiningTimes(Integer userId, LocalDateTime startTime,
		LocalDateTime endTime) {
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

		List<MiningTime> miningTimeList = miningTimeService.findMiningTimesByUserIdAndTimeRange(userId,
			startUtc, endUtc);

		return miningTimeList.stream()
			// 각 MiningTime을 KST 날짜와 해당 시간(분)을 계산한 결과로 매핑한 후 그룹화
			.collect(Collectors.groupingBy(
				miningTime -> miningTime.getStartTime().plusHours(9).toLocalDate(),
				Collectors.summingLong(miningTime ->
					Duration.between(miningTime.getStartTime(), miningTime.getEndTime()).toMinutes()
				)
			))
			// 그룹화된 Map의 엔트리를 MiningTimeResponseDto로 변환
			.entrySet().stream()
			.map(entry -> MiningTimeResponseDto.builder()
				.date(entry.getKey())
				.totalTime(Math.toIntExact(entry.getValue()))
				.build()
			)
			// 최종 결과를 List로 수집
			.collect(Collectors.toList());
	}

	// 우수사원 랭킹 조회
	@Override
	public Map<String, List<MiningTimeRankResponseDto>> findMiningRank(Integer top) {
		if (top == null || top <= 0) {
			throw new CustomException(ErrorCode.TOP_VARIABLE_ERROR);
		}

		ZoneId seoulZone = ZoneId.of("Asia/Seoul");
		ZonedDateTime nowKst = ZonedDateTime.now(seoulZone);

		List<LocalDateTime> bounds = calculatePreviousWeekUtcBounds(LocalDateTime.now(), seoulZone);

		// 채굴 랭킹 조회 (분 단위, 내림차순 정렬)
		List<MiningTimeRankResponseDto> miningRank = miningTimeService.findMiningRank(bounds.get(0), bounds.get(1));

		// 등수 그룹을 부여하기 위한 로직
		Map<Integer, List<MiningTimeRankResponseDto>> rankMap = calculationRank(miningRank, top);

		return convertJson(rankMap);
	}

	@Transactional
	@Override
	public void bulkSendToken() {
		log.info("토큰 전송 스케줄러 시작...");
		List<User> users = null;
		try {
			users = userService.getUsersByRole();
		} catch (Exception e) {
			log.error("사용자 목록 조회 중 오류 발생", e);
			users = Collections.emptyList();
		}

		if (users != null && !users.isEmpty()) {
			log.info("{}명의 사용자에 대해 토큰 전송을 시작합니다.", users.size());

			users.forEach(user -> {
				if (user == null || user.getWallet() == null || user.getWallet().isEmpty() || user.getPoint() == null) {
					log.warn("사용자 정보 없음");
					return;
				}

				int pointsToSend = user.getPoint() / 10;
				if (pointsToSend <= 0) {
					log.warn("전송할 포인트 없음");
					return;
				}

				String name = user.getName();
				String walletAddress = user.getWallet();
				String amountStr = Integer.toString(pointsToSend);

				log.debug("토큰 전송 시도 사용자명={}", name);
				try {
					// --- RestTemplate 동기 호출 ---
					String response = expressApiService.transferToken(
						walletAddress,
						amountStr
					);
					log.info("토큰 전송 API 성공. 응답 일부: {}",
						response != null ? response.substring(0, Math.min(response.length(), 100)) :
							"null"); // 응답이 길 수 있으므로 일부만 로깅

					user.setPoint(0);

				} catch (RestClientException e) {
					log.error("사용자={} 토큰 전송 API 호출 실패: {}", name, e.getMessage());
				} catch (Exception e) {
					log.error("사용자={} 처리 중 예상치 못한 오류 발생: {}", name, e.getMessage(), e);
				}
			});

		} else {
			log.info("토큰 전송 대상 사용자가 없습니다.");
		}

		log.info("토큰 전송 스케줄러 종료.");
	}

	@Transactional
	@Override
	public List<MintAddressResponse> bulkCreateNFT() {

		List<MintAddressResponse> result = new ArrayList<>();
		log.info("NFT 생성 스케줄러 시작...");
		ZoneId seoulZone = ZoneId.of("Asia/Seoul");

		List<LocalDateTime> bounds = calculatePreviousWeekUtcBounds(LocalDateTime.now().plusDays(1), seoulZone);

		if (bounds.size() != 2) {
			log.error("기간 계산 오류. 스케줄러를 종료합니다.");
			return result;
		}

		List<MiningTimeRankResponseDto> miningRank = miningTimeService.findMiningRank(bounds.get(0), bounds.get(1));

		if (miningRank == null || miningRank.isEmpty()) {
			log.info("NFT 생성 대상 랭킹 데이터가 없습니다.");
			return result;
		}

		Map<Integer, List<MiningTimeRankResponseDto>> rankMap = calculationRank(miningRank, 3);
		Map<String, List<MiningTimeRankResponseDto>> stringListMap = convertJson(rankMap);

		for (String s : stringListMap.keySet()) {
			List<MiningTimeRankResponseDto> miningTimeRankResponseDtos = stringListMap.get(s);

			for (MiningTimeRankResponseDto miningTimeRankResponseDto : miningTimeRankResponseDtos) {
				int userId = miningTimeRankResponseDto.getId();

				User user = userService.getUserById(userId);

				if (user == null) {
					log.warn("사용자 정보를 찾을 수 없습니다. User ID: {}", userId);
					continue;
				}

				if (user.getWallet() == null || user.getWallet().isEmpty()) {
					log.warn("사용자 ID {}의 지갑 주소가 없습니다. NFT 생성을 건너<0xEB><0x9B><0x81>니다.", userId);
					continue;
				}

				LocalDate currentDate = LocalDate.now();
				int year = currentDate.getYear();
				int month = currentDate.getMonthValue();
				int dayOfMonth = currentDate.getDayOfMonth();
				int weekOfMonth = (dayOfMonth - 1) / 7 + 1;
				String name = String.format("%d년 %d월 %d주차", year, month, weekOfMonth);
				String description = s + "위 에게 수여되는 NFT";
				List<ExpressApiService.Attribute> attributes = new ArrayList<>();
				ExpressApiService.Attribute attribute = new ExpressApiService.Attribute("range",
					year + "-" + month + "-" + dayOfMonth + "-" + weekOfMonth);
				ExpressApiService.Attribute attribute2 = new ExpressApiService.Attribute("rank", s);
				ExpressApiService.Attribute attribute3 = new ExpressApiService.Attribute("name", user.getName());
				attributes.add(attribute);
				attributes.add(attribute2);
				attributes.add(attribute3);
				try {
					log.debug("NFT 생성 API 호출 시도. User ID: {}, Rank: {}", userId, s);

					String response = expressApiService.createNft(s, name, description, attributes, "SSAFY"); // 동기 호출

					log.info("NFT 생성 API 호출 성공. User ID: {}, Rank: {}, Response: {}", userId, s, response);
					CreateNftApiResponse createNftApiResponse = objectMapper.readValue(response,
						CreateNftApiResponse.class);
					MintAddressResponse mintAddressResponse = new MintAddressResponse(
						createNftApiResponse.getMintAddress(), user.getWallet());
					result.add(mintAddressResponse);
				} catch (RestClientException e) {
					log.error("NFT 생성 API 호출 실패. User ID: {}, Rank: {}, Error: {}", userId, s, e.getMessage());
				} catch (Exception e) {
					log.error("NFT 생성 처리 중 예상치 못한 오류 발생. User ID: {}, Rank: {}, Error: {}", userId, s, e.getMessage(),
						e);
				}
			}
		}
		log.info("NFT 생성 스케줄러 종료");
		return result;
	}

	@Transactional
	@Override
	public void bulkSendNFT(List<MintAddressResponse> mintAddresses) {
		log.info("NFT 전송 작업 시작");

		if (mintAddresses == null || mintAddresses.isEmpty()) {
			log.info("NFT 전송 대상 목록이 비어있습니다. 작업을 종료합니다.");
			return;
		}

		log.info("{}개의 NFT 전송을 시작합니다.", mintAddresses.size());

		// forEach 루프 시작
		mintAddresses.forEach(target -> {
			// 1. 입력 데이터 유효성 검사
			if (target == null || target.getWallet() == null || target.getWallet().isEmpty()
				|| target.getAddress() == null || target.getAddress().isEmpty()) {
				log.warn("NFT 전송 건너<0xEB><0x9B><0x81>: 유효하지 않은 입력 데이터. {}", target);
				return; // 다음 항목으로 (forEach의 continue 역할)
			}

			String recipientWallet = target.getWallet();
			String nftMintAddress = target.getAddress();
			// 로깅을 위한 식별자 (지갑/민트 주소 활용)
			String identifier = String.format("받는사람=%s, 민트=%s", recipientWallet, nftMintAddress);

			log.debug("NFT 전송 시도: {}", identifier);

			try {
				String response = expressApiService.transferNft(recipientWallet, nftMintAddress);

				log.info("NFT 전송 API 호출 성공: {}, 응답 일부: {}", identifier,
					response != null ? response.substring(0, Math.min(response.length(), 100)) : "null");

			} catch (RestClientException e) {
				log.error("NFT 전송 API 호출 실패: {}, 오류: {}", identifier, e.getMessage());

			} catch (Exception e) {
				log.error("NFT 전송 처리 중 예상치 못한 오류 발생: {}, 오류: {}", identifier, e.getMessage(), e);
			}
		});

		log.info("NFT 전송 종료");
	}

	private static final double EARTH_RADIUS = 6371000;

	private static boolean isWithinRadius(float lat1, float lon1, float lat2, float lon2, double radiusInMeters) {
		double dLat = Math.toRadians(lat2 - lat1);
		double dLon = Math.toRadians(lon2 - lon1);

		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
			+ Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
			* Math.sin(dLon / 2) * Math.sin(dLon / 2);

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		double distance = EARTH_RADIUS * c;

		return distance <= radiusInMeters;
	}

	private List<LocalDateTime> calculatePreviousWeekUtcBounds(LocalDateTime referenceLocalDateTime,
		ZoneId calculationZone) {
		// 입력된 LocalDateTime과 ZoneId를 결합하여 ZonedDateTime 생성
		ZonedDateTime referenceDateTime = referenceLocalDateTime.atZone(calculationZone);

		// 지난주 월요일 00:00 (calculationZone 기준)
		ZonedDateTime lastWeekMondayInZone = referenceDateTime
			.minusWeeks(1) // 1주 전으로 이동
			.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) // 해당 날짜 또는 그 이전의 월요일 찾기
			.truncatedTo(ChronoUnit.DAYS); // 날짜의 시작(00:00:00)으로 설정

		// 지난주 일요일 23:59:59.999... (calculationZone 기준)
		ZonedDateTime lastWeekSundayInZone = lastWeekMondayInZone
			.plusDays(6)
			.with(LocalTime.MAX);

		// 계산된 각 시점을 UTC Instant로 변환
		Instant startUtcInstant = lastWeekMondayInZone.toInstant();
		Instant endUtcInstant = lastWeekSundayInZone.toInstant();

		// UTC Instant를 UTC 기준의 LocalDateTime으로 변환
		LocalDateTime startTimeUtc = LocalDateTime.ofInstant(startUtcInstant, ZoneOffset.UTC);
		LocalDateTime endTimeUtc = LocalDateTime.ofInstant(endUtcInstant, ZoneOffset.UTC);

		// 결과를 List에 담아 반환
		List<LocalDateTime> bounds = new ArrayList<>();
		bounds.add(startTimeUtc); // 인덱스 0: 시작 시각
		bounds.add(endTimeUtc);   // 인덱스 1: 종료 시각
		return bounds;
	}

	private Map<Integer, List<MiningTimeRankResponseDto>> calculationRank(List<MiningTimeRankResponseDto> miningRank,
		int top) {
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
		return rankMap;
	}

	private Map<String, List<MiningTimeRankResponseDto>> convertJson(
		Map<Integer, List<MiningTimeRankResponseDto>> rankMap) {
		// JSON 형태에 맞게 키를 문자열로 변환
		Map<String, List<MiningTimeRankResponseDto>> result = new LinkedHashMap<>();
		for (Map.Entry<Integer, List<MiningTimeRankResponseDto>> entry : rankMap.entrySet()) {
			result.put(String.valueOf(entry.getKey()), entry.getValue());
		}

		return result;
	}

	@Getter
	private static class CreateNftApiResponse {
		private boolean success;
		private String message;
		private String mintAddress;
		private String transaction;
	}

	@Getter
	@AllArgsConstructor
	public static class MintAddressResponse {
		private String address;
		private String wallet;
	}
}
