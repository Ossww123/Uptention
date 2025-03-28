package com.otoki.uptention.mining.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.otoki.uptention.application.mining.service.MiningTimeAppServiceImpl;
import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.service.MiningTimeService;
import com.otoki.uptention.domain.user.entity.User;

@ExtendWith(MockitoExtension.class)
class MiningTimeAppServiceImplTest {

	@Mock
	private MiningTimeService miningTimeService;

	@InjectMocks
	private MiningTimeAppServiceImpl miningTimeAppService;

	@Test
	@DisplayName("지정 된 시간에 end_time이 비어 있는 mining time은 지정 시간으로 업데이트된다")
	void bulkUpdateMiningTime() {
		Integer userId = 1;
		User user = createUser(userId);

		MiningTime miningTime1 = createMiningTime(user, LocalDateTime.now().minusHours(1), null);
		MiningTime miningTime2 = createMiningTime(user, LocalDateTime.now().minusHours(1), null);
		MiningTime miningTime3 = createMiningTime(user, LocalDateTime.now().minusHours(1), null);

		List<MiningTime> miningTimes = Arrays.asList(miningTime1, miningTime2, miningTime3);

		when(miningTimeService.findAllByEndTimeIsNull()).thenReturn(miningTimes);

		miningTimeAppService.bulkUpdateMiningTime();

		for (MiningTime miningTime : miningTimes) {
			assertNotNull(miningTime.getEndTime(), "mining end time should not be null");
		}

		verify(miningTimeService, times(3)).saveMiningTime(any(MiningTime.class));
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