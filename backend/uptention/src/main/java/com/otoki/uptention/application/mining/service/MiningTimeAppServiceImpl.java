package com.otoki.uptention.application.mining.service;

import java.text.DecimalFormat;
import java.time.DayOfWeek;
import java.time.Duration;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.otoki.uptention.application.mining.dto.request.FocusModeOnRequestDto;
import com.otoki.uptention.application.mining.dto.response.CreateNftApiResponse;
import com.otoki.uptention.application.mining.dto.response.MiningTimeResponseDto;
import com.otoki.uptention.application.mining.dto.response.MintAddressResponse;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;
import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.service.MiningTimeService;
import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.notification.service.NotificationService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.otoki.uptention.global.util.DateTimeUtils;
import com.otoki.uptention.global.service.FcmSendService;
import com.otoki.uptention.infra.solana.dto.Attribute;
import com.otoki.uptention.infra.solana.service.SolanaExpressApiServiceImpl;

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
	private final SolanaExpressApiServiceImpl solanaExpressApiServiceImpl;
	private final ObjectMapper objectMapper;
	private final NotificationService notificationService;
	private final FcmSendService fcmSendService;

	@Transactional
	@Override
	public void focusModeOn(FocusModeOnRequestDto focusModeOnRequestDto) {
		User loggedInUser = securityService.getLoggedInUser();
		Company company = loggedInUser.getCompany();

		LocalDateTime now = LocalDateTime.now();
		LocalDateTime startInspection = now.toLocalDate().atTime(14, 30);
		LocalDateTime endInspection   = now.toLocalDate().atTime(15, 0);
		if (now.isAfter(startInspection) && now.isBefore(endInspection)) {
			throw new CustomException(ErrorCode.FOCUS_MODE_INSPECTION);
		}

		boolean inRange = isWithinRadius(
			company.getLatitude(), company.getLongitude(),
			focusModeOnRequestDto.getLatitude(), focusModeOnRequestDto.getLongitude(),
			500.0);
		if (!inRange) {
			throw new CustomException(ErrorCode.FOCUS_MODE_INVALID_RANGE);
		}

		MiningTime ongoing = miningTimeService.findMiningTime(loggedInUser);
		if (ongoing != null && ongoing.getEndTime() == null) {
			ongoing.updateEndTime(now);
			long minutes = Duration.between(ongoing.getStartTime(), now).toMinutes();
			loggedInUser.setPoint(loggedInUser.getPoint() + (int) minutes);
		}

		MiningTime newSession = MiningTime.builder()
			.user(loggedInUser)
			.startTime(now)
			.endTime(null)
			.build();
		miningTimeService.saveMiningTime(newSession);
	}

	@Transactional
	@Override
	public void focusModeOff() {
		User loggedInUser = securityService.getLoggedInUser();
		MiningTime session = miningTimeService.findMiningTime(loggedInUser);
		if (session == null || session.getEndTime() != null) {
			throw new CustomException(ErrorCode.FOCUS_MODE_OFF_FAILED);
		}

		LocalDateTime now = LocalDateTime.now();
		LocalDateTime startInspection = now.toLocalDate().atTime(14, 30);
		LocalDateTime endInspection   = now.toLocalDate().atTime(15, 0);
		if (now.isAfter(startInspection) && now.isBefore(endInspection)) {
			throw new CustomException(ErrorCode.FOCUS_MODE_INSPECTION);
		}

		session.updateEndTime(now);
		long minutes = Duration.between(session.getStartTime(), now).toMinutes();
		loggedInUser.setPoint(loggedInUser.getPoint() + (int) minutes);
		miningTimeService.saveMiningTime(session);
	}

	@Transactional
	@Override
	public void executeDailyMiningProcesses() {
		log.info("Executing daily mining processes");
		bulkUpdateMiningTime();
		bulkUpdateUserPoints();
		bulkSendToken();
		log.info("Completed daily mining processes");
	}

	@Transactional
	@Override
	public void executeWeeklyNftProcesses() {
		log.info("Executing weekly NFT processes");
		List<MintAddressResponse> mints = bulkCreateNFT();
		bulkSendNFT(mints);
		log.info("Completed weekly NFT processes");
	}

	@Override
	public List<MiningTimeResponseDto> findAllMiningTimes(
		Integer userId,
		ZonedDateTime startZoned,    // 클라이언트 로컬 타임존 정보 포함
		ZonedDateTime endZoned       // 클라이언트 로컬 타임존 정보 포함
	) {
		User user = securityService.getLoggedInUser();
		if (!user.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}
		if (endZoned.isBefore(startZoned)) {
			throw new CustomException(ErrorCode.INVALID_DATE_RANGE);
		}

		// ——— 1) 클라이언트 로컬 → UTC LocalDateTime
		LocalDateTime startUtc = startZoned
			.withZoneSameInstant(ZoneOffset.UTC)
			.toLocalDateTime();
		LocalDateTime endUtc   = endZoned
			.withZoneSameInstant(ZoneOffset.UTC)
			.toLocalDateTime();

		// DB 조회 (UTC 기준으로 저장·조회 중이라면)
		List<MiningTime> sessions = miningTimeService
			.findMiningTimesByUserIdAndTimeRange(userId, startUtc, endUtc);

		// ——— 2) 그룹핑 시, UTC 저장값 → 클라이언트 로컬 날짜로 변환
		ZoneId clientZone = startZoned.getZone();
		return sessions.stream()
			.collect(Collectors.groupingBy(
				mt -> ZonedDateTime
					.of(mt.getStartTime(), ZoneOffset.UTC)      // UTC → Zoned
					.withZoneSameInstant(clientZone)           // → 클라이언트 로컬
					.toLocalDate(),                            // → LocalDate
				Collectors.summingLong(mt ->
					Duration.between(mt.getStartTime(), mt.getEndTime())
						.toMinutes()
				)
			))
			.entrySet().stream()
			.map(e -> MiningTimeResponseDto.builder()
				.date(e.getKey())
				.totalTime(Math.toIntExact(e.getValue()))
				.build())
			.collect(Collectors.toList());
	}

	@Override
	public Map<String, List<MiningTimeRankResponseDto>> findMiningRank(
		Integer top,
		ZonedDateTime referenceZoned    // ← 클라이언트 로컬 타임존 정보 포함
	) {
		if (top == null || top <= 0) {
			throw new CustomException(ErrorCode.TOP_VARIABLE_ERROR);
		}

		// 1. 지난주 월요일 00:00 (clientZone 기준)
		ZonedDateTime startOfLastWeek = referenceZoned
			.minusWeeks(1)
			.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
			.truncatedTo(ChronoUnit.DAYS);

		// 2. 지난주 일요일 23:59:59.999 (clientZone 기준)
		ZonedDateTime endOfLastWeek = startOfLastWeek
			.plusDays(6)
			.with(LocalTime.MAX);

		// 3. UTC로 변환해 DB 조회용 LocalDateTime 생성
		LocalDateTime startUtc = startOfLastWeek
			.withZoneSameInstant(ZoneOffset.UTC)
			.toLocalDateTime();
		LocalDateTime endUtc   = endOfLastWeek
			.withZoneSameInstant(ZoneOffset.UTC)
			.toLocalDateTime();

		// 4. DB에서 UTC 범위로 랭킹 조회
		List<MiningTimeRankResponseDto> ranks =
			miningTimeService.findMiningRank(startUtc, endUtc);

		// 5. 등수 계산
		Map<Integer, List<MiningTimeRankResponseDto>> rankMap =
			calculationRank(ranks, top);

		// 6. JSON 형태로 변환하여 반환
		return convertJson(rankMap);
	}

	private int bulkUpdateMiningTime() {
		LocalDateTime cutoff = LocalDateTime.now().toLocalDate().atTime(14, 30);
		return miningTimeService.updateEndTimeForUnfinishedMining(cutoff);
	}

	private int bulkUpdateUserPoints() {
		LocalDateTime cutoff = LocalDateTime.now().toLocalDate().atTime(14, 30);
		return miningTimeService.calculatePoint(cutoff);
	}

	private void bulkSendToken() {
		log.info("Token send scheduler start");
		List<User> users;
		try {
			users = userService.getUsersByRole();
		} catch (Exception e) {
			log.error("Error fetching users", e);
			return;
		}
		if (users.isEmpty()) {
			log.info("No users to send tokens");
			return;
		}
		users.forEach(u -> {
			if (u.getWallet() == null || u.getPoint() == null || u.getPoint() <= 0) return;
			double toSend = u.getPoint() / 10.0;
			String amt = new DecimalFormat("0.0").format(toSend);
			try {
				String resp = solanaExpressApiServiceImpl.transferToken(u.getWallet(), amt);
				log.info("Token sent: {}", resp);
				u.setPoint(0);
			} catch (Exception ex) {
				log.error("Token send failed for {}: {}", u.getId(), ex.getMessage());
			}
		});
		log.info("Token send scheduler end");
	}

	private List<MintAddressResponse> bulkCreateNFT() {
		List<MintAddressResponse> result = new ArrayList<>();
		log.info("NFT creation scheduler start");
		ZoneId kst = ZoneId.of("Asia/Seoul");
		List<LocalDateTime> bounds = calculatePreviousWeekUtcBounds(LocalDateTime.now().plusDays(1), kst);
		if (bounds.size() != 2) {
			log.error("Date bounds error");
			return result;
		}
		List<MiningTimeRankResponseDto> ranks = miningTimeService.findMiningRank(bounds.get(0), bounds.get(1));
		if (ranks.isEmpty()) {
			log.info("No rank data for NFT");
			return result;
		}
		Map<Integer, List<MiningTimeRankResponseDto>> rankMap = calculationRank(ranks, 3);
		Map<String, List<MiningTimeRankResponseDto>> jsonMap = convertJson(rankMap);
		jsonMap.forEach((rank, list) -> list.forEach(dto -> {
			User user = userService.getUserById(dto.getId());
			if (user == null || user.getWallet() == null) return;
			LocalDate date = LocalDate.now();
			String weekName = String.format("%d년 %d월 %d주차", date.getYear(), date.getMonthValue(), (date.getDayOfMonth()-1)/7+1);
			List<Attribute> attrs = new ArrayList<>();
			attrs.add(new Attribute("range", String.format("%d-%d-%d-%d", date.getYear(), date.getMonthValue(), date.getDayOfMonth(), (date.getDayOfMonth()-1)/7+1)));
			attrs.add(new Attribute("rank", rank));
			attrs.add(new Attribute("name", user.getName()));
			try {
				String resp = solanaExpressApiServiceImpl.createNft(rank, weekName, rank + "위에게 수여되는 NFT", attrs, "SSAFY");
				CreateNftApiResponse apiResp = objectMapper.readValue(resp, CreateNftApiResponse.class);
				result.add(new MintAddressResponse(user.getId(), apiResp.getMintAddress(), user.getWallet()));
			} catch (Exception ex) {
				log.error("NFT creation failed for {}: {}", dto.getId(), ex.getMessage());
			}
		}));
		log.info("NFT creation scheduler end");
		return result;
	}

	private void bulkSendNFT(List<MintAddressResponse> mintAddresses) {
		log.info("NFT send start");
		if (mintAddresses.isEmpty()) {
			log.info("No NFTs to send");
			return;
		}
		mintAddresses.forEach(target -> {
			if (target.getWallet() == null || target.getAddress() == null) return;
			try {
				String resp = solanaExpressApiServiceImpl.transferNft(target.getWallet(), target.getAddress());
				log.info("NFT sent: {}", resp);
				Notification notification = Notification.builder()
					.title("🎉우수 사원 NFT 도착!🎉")
					.message(target.getId() + "님 축하드립니다!")
					.user(userService.getUserById(target.getId()))
					.build();
				notificationService.saveNotification(notification);
				fcmSendService.sendNotificationToUser(notification.getUser(), notification.getTitle(), notification.getMessage());
			} catch (Exception ex) {
				log.error("NFT send failed for {}: {}", target.getId(), ex.getMessage());
			}
		});
		log.info("NFT send end");
	}

	private static final double EARTH_RADIUS = 6371000;
	private static boolean isWithinRadius(float lat1, float lon1, float lat2, float lon2, double radius) {
		double dLat = Math.toRadians(lat2 - lat1);
		double dLon = Math.toRadians(lon2 - lon1);
		double a = Math.sin(dLat/2)*Math.sin(dLat/2)
			+ Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))
			* Math.sin(dLon/2)*Math.sin(dLon/2);
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return EARTH_RADIUS * c <= radius;
	}

	private List<LocalDateTime> calculatePreviousWeekUtcBounds(LocalDateTime reference, ZoneId zone) {
		ZonedDateTime refZ = reference.atZone(zone);
		ZonedDateTime start = refZ.minusWeeks(1)
			.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
			.truncatedTo(ChronoUnit.DAYS);
		ZonedDateTime end   = start.plusDays(6).with(LocalTime.MAX);
		LocalDateTime startUtc = DateTimeUtils.toUtc(start.toLocalDateTime(), zone);
		LocalDateTime endUtc   = DateTimeUtils.toUtc(end.toLocalDateTime(), zone);
		List<LocalDateTime> bounds = new ArrayList<>();
		bounds.add(startUtc);
		bounds.add(endUtc);
		return bounds;
	}

	private Map<Integer, List<MiningTimeRankResponseDto>> calculationRank(
		List<MiningTimeRankResponseDto> ranks, int top
	) {
		Map<Integer, List<MiningTimeRankResponseDto>> map = new LinkedHashMap<>();
		int currentRank = 0;
		Long prevTotal = null;
		for (MiningTimeRankResponseDto dto : ranks) {
			if (prevTotal == null || !dto.getTotalMiningMinutes().equals(prevTotal)) {
				currentRank = map.size() + 1;
				if (currentRank > top) break;
			}
			map.computeIfAbsent(currentRank, k -> new ArrayList<>()).add(dto);
			prevTotal = dto.getTotalMiningMinutes();
		}
		return map;
	}

	private Map<String, List<MiningTimeRankResponseDto>> convertJson(
		Map<Integer, List<MiningTimeRankResponseDto>> rankMap
	) {
		return rankMap.entrySet().stream()
			.collect(Collectors.toMap(
				e -> String.valueOf(e.getKey()),
				Map.Entry::getValue,
				(a, b) -> a,
				LinkedHashMap::new
			));
	}
}
