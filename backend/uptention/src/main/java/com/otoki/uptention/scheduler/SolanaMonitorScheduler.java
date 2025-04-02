package com.otoki.uptention.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.otoki.uptention.solana.service.SolanaTransactionMonitorService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class SolanaMonitorScheduler {

	private final SolanaTransactionMonitorService solanaTransactionMonitorService;

	/**
	 * 지나치게 오래된 처리 완료된 트랜잭션 서명 정리 (메모리 관리)
	 */
	@Scheduled(fixedDelay = 60000) // 60초마다 실행
	public void cleanupProcessedSignatures() {
		solanaTransactionMonitorService.cleanupProcessedSignatures();
	}

	/**
	 * WebSocket 연결 상태 확인 및 재연결
	 */
	@Scheduled(fixedDelay = 300000) // 5분마다 실행
	public void checkWebSocketConnection() {
		solanaTransactionMonitorService.checkWebSocketConnection();
	}
}
