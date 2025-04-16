package com.otoki.uptention.solana.service;

/**
 * Solana WebSocket 연결 및 구독을 관리하는 서비스 인터페이스
 */
public interface SolanaWebSocketService {

	/**
	 * WebSocket 연결 상태를 반환합니다.
	 * @return WebSocket 연결 상태 (true: 연결됨, false: 연결 안됨)
	 */
	boolean isWebSocketConnected();

	/**
	 * WebSocket 연결을 시작하고 로그 구독을 설정합니다.
	 */
	void connectWebSocket();

	/**
	 * WebSocket 연결 상태를 확인하고 필요 시 재연결합니다.
	 */
	void checkWebSocketConnection();
}