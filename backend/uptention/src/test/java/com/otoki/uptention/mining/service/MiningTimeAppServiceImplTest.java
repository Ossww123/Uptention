package com.otoki.uptention.mining.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.otoki.uptention.application.mining.service.MiningTimeAppServiceImpl;
import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.service.MiningTimeService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.infra.solana.service.ExpressApiService;

@ExtendWith(MockitoExtension.class)
class MiningTimeAppServiceImplTest {

	@Mock
	private MiningTimeService miningTimeService;

	@Mock
	private UserService userService;

	@Mock
	private ExpressApiService expressApiService;

	@Mock
	private ObjectMapper objectMapper;

	@InjectMocks
	private MiningTimeAppServiceImpl miningTimeAppService;

	@Test
	@DisplayName("지정 된 시간에 end_time이 비어 있는 mining time은 지정 시간으로 업데이트된다")
	void bulkUpdateMiningTime() throws Exception {
		Integer userId = 1;
		User user = createUser(userId);

		MiningTime miningTime1 = createMiningTime(user, LocalDateTime.now().minusHours(1), null);
		MiningTime miningTime2 = createMiningTime(user, LocalDateTime.now().minusHours(1), null);
		MiningTime miningTime3 = createMiningTime(user, LocalDateTime.now().minusHours(1), null);
		List<MiningTime> miningTimes = Arrays.asList(miningTime1, miningTime2, miningTime3);

		// bulk 업데이트 대상 시간이 오늘 14:30
		LocalDateTime expectedEndTime = LocalDate.now().atTime(14, 30);

		// miningTimeService의 bulk update 메서드가 호출되면 업데이트된 행 수(여기서는 3)를 반환하도록 목킹
		when(miningTimeService.updateEndTimeForUnfinishedMining(expectedEndTime))
			.thenReturn(miningTimes.size());

		// private 메서드를 직접 호출하기 위해 리플렉션 사용
		int updatedCount = (int)ReflectionTestUtils.invokeMethod(miningTimeAppService,
			"bulkUpdateMiningTime");

		// Assert: Repository의 bulk update 메서드가 한 번 호출되었는지와 반환값이 예상과 일치하는지 검증
		verify(miningTimeService, times(1)).updateEndTimeForUnfinishedMining(expectedEndTime);
		assertEquals(miningTimes.size(), updatedCount, "업데이트된 MiningTime의 수가 일치해야 합니다.");
	}

	private User createUser(Integer id) {
		return User.builder()
			.id(id)
			.username("testUser")
			.build();
	}

	// 헬퍼 메서드: 테스트용 MiningTime 객체 생성
	private MiningTime createMiningTime(User user, LocalDateTime startTime, LocalDateTime endTime) {
		return MiningTime.builder()
			.user(user)
			.startTime(startTime)
			.endTime(endTime)
			.build();
	}
}