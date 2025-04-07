package com.otoki.uptention.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.mining.service.MiningTimeAppService;
import com.otoki.uptention.application.mining.service.MiningTimeAppServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class MiningTimeScheduler {

	private final MiningTimeAppService miningTimeAppService;

	@Transactional
	@Scheduled(cron = "00 30 23 * * *", zone = "Asia/Seoul")
	public void updateNullEndTime() {
		log.info("Updating null end time for scheduler");
		miningTimeAppService.bulkUpdateMiningTime();
		log.info("Updating user point for scheduler");
		miningTimeAppService.bulkUpdateUserPoints();
		log.info("Send Token for scheduler");
		miningTimeAppService.bulkSendToken();
	}

	@Transactional
	@Scheduled(cron = "00 45 23 * * SUN", zone = "Asia/Seoul")
	public void sendNft() {
		log.info("Create NFT for scheduler");
		List<MiningTimeAppServiceImpl.MintAddressResponse> mintAddressResponses = miningTimeAppService.bulkCreateNFT();
		log.info("Send NFT for scheduler");
		miningTimeAppService.bulkSendNFT(mintAddressResponses);
	}
}
