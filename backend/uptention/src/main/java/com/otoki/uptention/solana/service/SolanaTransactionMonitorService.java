package com.otoki.uptention.solana.service;

/**
 * Solana 트랜잭션을 모니터링하는 서비스 인터페이스
 * 회사 지갑으로 들어오는 워크 토큰 트랜잭션을 모니터링하고 주문 결제 처리를 담당합니다.
 */
public interface SolanaTransactionMonitorService {

	/**
	 * WebSocket 연결 상태를 반환합니다.
	 * @return WebSocket 연결 상태 (true: 연결됨, false: 연결 안됨)
	 */
	boolean isWebSocketConnected();

	/**
	 * 처리된 트랜잭션 서명 중 오래된 것들을 정리합니다.
	 * 메모리 관리를 위해 주기적으로 호출됩니다.
	 */
	void cleanupProcessedSignatures();

	/**
	 * WebSocket 연결 상태를 확인하고 필요 시 재연결합니다.
	 * 주기적으로 호출되어 연결 상태를 유지합니다.
	 */
	void checkWebSocketConnection();
}