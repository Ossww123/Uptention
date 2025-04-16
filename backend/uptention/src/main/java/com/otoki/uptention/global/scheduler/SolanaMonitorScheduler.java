package com.otoki.uptention.global.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.otoki.uptention.global.lock.DistributedLockManager;
import com.otoki.uptention.solana.service.SolanaTransactionMonitorService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class SolanaMonitorScheduler {
	private static final String CLEANUP_LOCK = "scheduler:solana:cleanup";
	private static final String WEBSOCKET_CHECK_LOCK = "scheduler:solana:websocket";

	private final SolanaTransactionMonitorService solanaTransactionMonitorService;
	private final DistributedLockManager lockManager;

	/**
	 * 지나치게 오래된 처리 완료된 트랜잭션 서명 정리 (메모리 관리)
	 */
	@Scheduled(fixedDelay = 60000) // 60초마다 실행
	public void cleanupProcessedSignatures() {
		lockManager.executeWithLock(CLEANUP_LOCK, 5, 55, () -> {
			log.info("트랜잭션 서명 정리 작업 시작");
			solanaTransactionMonitorService.cleanupProcessedSignatures();
			log.info("트랜잭션 서명 정리 작업 완료");
		});
	}

	/**
	 * WebSocket 연결 상태 확인 및 재연결
	 */
	@Scheduled(fixedDelay = 300000) // 5분마다 실행
	public void checkWebSocketConnection() {
		lockManager.executeWithLock(WEBSOCKET_CHECK_LOCK, 10, 240, () -> {
			log.info("WebSocket 연결 상태 확인 시작");
			solanaTransactionMonitorService.checkWebSocketConnection();
			log.info("WebSocket 연결 상태 확인 완료");
		});
	}
}
