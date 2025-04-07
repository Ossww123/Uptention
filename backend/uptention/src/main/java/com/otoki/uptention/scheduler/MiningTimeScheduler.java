package com.otoki.uptention.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.mining.service.MiningTimeAppService;
import com.otoki.uptention.global.lock.DistributedLockManager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class MiningTimeScheduler {

	private static final String UPDATE_MINING_LOCK = "scheduler:mining:update";
	private static final String SEND_NFT_LOCK = "scheduler:mining:nft";

	private final MiningTimeAppService miningTimeAppService;
	private final DistributedLockManager lockManager;

	@Transactional
	@Scheduled(cron = "00 30 23 * * *", zone = "Asia/Seoul")
	public void updateNullEndTime() {
		lockManager.executeWithLock(UPDATE_MINING_LOCK, 30, 1800, () -> {
			log.info("Acquired lock for daily mining processes");
			// 서비스 레이어의 트랜잭션 메서드 호출
			miningTimeAppService.executeDailyMiningProcesses();
		});
	}

	@Transactional
	@Scheduled(cron = "00 45 23 * * SUN", zone = "Asia/Seoul")
	public void sendNft() {
		lockManager.executeWithLock(SEND_NFT_LOCK, 30, 3600, () -> {
			log.info("Acquired lock for weekly NFT processes");
			// 서비스 레이어의 트랜잭션 메서드 호출
			miningTimeAppService.executeWeeklyNftProcesses();
		});
	}
}
