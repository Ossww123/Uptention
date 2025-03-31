package com.otoki.uptention.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.otoki.uptention.application.mining.service.MiningTimeAppService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MiningTimeScheduler {

	private final MiningTimeAppService miningTimeAppService;

	@Scheduled(cron = "0 30 14 * * *", zone = "UTC")
	public void updateNullEndTime() {
		miningTimeAppService.bulkUpdateMiningTime();
		miningTimeAppService.bulkUpdateUserPoints();
	}
}
