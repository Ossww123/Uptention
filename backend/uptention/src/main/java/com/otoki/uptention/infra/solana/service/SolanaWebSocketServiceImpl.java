package com.otoki.uptention.infra.solana.service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.ws.SubscriptionWebSocketClient;
import org.p2p.solanaj.ws.listeners.NotificationEventListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.otoki.uptention.global.config.SolanaProperties;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Solana WebSocket 연결 및 구독을 관리하는 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SolanaWebSocketServiceImpl implements SolanaWebSocketService {

	private static final int WEBSOCKET_CONNECT_WAIT_MS = 2000;
	private static final int CONNECTION_RETRY_DELAY_MS = 5000;

	private final SolanaProperties solanaProperties;
	private final SolanaTransactionService transactionService;
	private final ObjectMapper objectMapper;

	private SubscriptionWebSocketClient webSocketClient;
	private final AtomicBoolean isRunning = new AtomicBoolean(false);

	@Getter
	private RpcClient rpcClient;

	@PostConstruct
	public void init() {
		log.info("Solana WebSocket 서비스 초기화 중...");
		log.info("WebSocket URL: {}", solanaProperties.getWebsocketUrl());

		// RPC 클라이언트 초기화
		initializeRpcClient();

		// WebSocket 연결 및 구독 설정
		connectWebSocket();
	}

	/**
	 * RPC 클라이언트 초기화
	 */
	private void initializeRpcClient() {
		try {
			// 커스텀 타임아웃 설정으로 RPC 클라이언트 생성
			rpcClient = new RpcClient(
				solanaProperties.getRpcUrl(),
				30, // readTimeout (seconds)
				30, // connectTimeout (seconds)
				30  // writeTimeout (seconds)
			);
			log.info("Solana RPC 클라이언트 초기화 성공");
		} catch (Exception e) {
			log.error("Solana RPC 클라이언트 초기화 실패", e);
		}
	}

	@PreDestroy
	public void cleanup() {
		disconnectWebSocket();
	}

	/**
	 * WebSocket 연결 상태 반환
	 */
	public boolean isWebSocketConnected() {
		return webSocketClient != null && webSocketClient.isOpen();
	}

	/**
	 * SolanaJ 라이브러리를 사용하여 WebSocket 연결 설정
	 */
	public void connectWebSocket() {
		try {
			// WebSocket 클라이언트 생성
			webSocketClient = SubscriptionWebSocketClient.getExactPathInstance(solanaProperties.getWebsocketUrl());

			try {
				// 연결이 될 때까지 잠시 대기
				Thread.sleep(WEBSOCKET_CONNECT_WAIT_MS);

				if (webSocketClient.isOpen()) {
					log.info("Solana WebSocket 연결 성공");
					isRunning.set(true);

					// 토큰 로그 구독
					subscribeToLogs();
				} else {
					log.error("Solana WebSocket 연결 실패");
					retryConnection();
				}
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				log.error("WebSocket 연결 대기 중 인터럽트 발생", e);
			}
		} catch (Exception e) {
			log.error("Solana WebSocket 연결 실패", e);
			retryConnection();
		}
	}

	/**
	 * 재연결 시도
	 */
	private void retryConnection() {
		try {
			Thread.sleep(CONNECTION_RETRY_DELAY_MS); // 5초 대기 후 재연결
			log.info("WebSocket 재연결 시도 중...");
			connectWebSocket();
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
	}

	/**
	 * 로그 구독 방식으로 워크토큰 로그 구독
	 */
	private void subscribeToLogs() {
		try {
			if (!isWebSocketConnected()) {
				log.warn("WebSocket 연결이 되어있지 않아 구독 요청을 보낼 수 없습니다");
				return;
			}

			log.info("워크토큰 민트 주소 로그 구독 요청 전송: {}", solanaProperties.getWorkTokenMint());

			// 토큰 민트 주소 로그 구독
			webSocketClient.logsSubscribe(solanaProperties.getWorkTokenMint(), new NotificationEventListener() {
				@Override
				public void onNotificationEvent(Object data) {
					handleTransactionNotification(data);
				}
			});

			log.info("워크 토큰 민트 로그 구독 완료");
		} catch (Exception e) {
			log.error("로그 구독 요청 실패", e);
		}
	}

	/**
	 * 트랜잭션 알림 처리
	 */
	private void handleTransactionNotification(Object data) {
		try {
			log.info("워크토큰 민트 관련 로그 알림 수신: {}", objectMapper.writeValueAsString(data));

			// 로그 데이터에서 트랜잭션 서명 추출
			@SuppressWarnings("unchecked")
			Map<String, Object> dataMap = (Map<String, Object>)data;

			if (!dataMap.containsKey("signature")) {
				log.info("트랜잭션 서명 없음");
				return;
			}

			String signature = dataMap.get("signature").toString();

			// 이미 처리된 트랜잭션인지 확인
			if (transactionService.isProcessedSignature(signature)) {
				log.info("이미 처리된 트랜잭션: {}", signature);
				return;
			}

			log.info("워크 토큰 트랜잭션 감지: {}", signature);

			// WebSocket에서 받은 로그 정보 사용
			if (dataMap.containsKey("logs") && dataMap.get("logs") != null) {
				@SuppressWarnings("unchecked")
				List<String> logs = (List<String>)dataMap.get("logs");

				// WebSocket 알림에서 받은 로그 정보로 처리
				transactionService.processTransactionWithLogs(signature, logs);
			} else {
				// 로그 정보가 없는 경우 RPC 호출로 처리
				transactionService.processTransactionBySignature(signature);
			}
		} catch (Exception e) {
			log.error("워크 토큰 로그 알림 처리 실패", e);
		}
	}

	/**
	 * WebSocket 연결 종료
	 */
	private void disconnectWebSocket() {
		try {
			if (isWebSocketConnected()) {
				webSocketClient.close();
				log.info("Solana WebSocket 연결 종료");
			}
		} catch (Exception e) {
			log.error("Solana WebSocket 연결 종료 실패", e);
		} finally {
			isRunning.set(false);
		}
	}

	/**
	 * WebSocket 연결 상태 확인 및 재연결
	 */
	public void checkWebSocketConnection() {
		try {
			if (isRunning.get() && !isWebSocketConnected()) {
				log.warn("WebSocket 연결이 끊어졌습니다. 재연결 시도 중...");
				connectWebSocket();
			}
		} catch (Exception e) {
			log.error("WebSocket 연결 상태 확인 중 오류", e);
		}
	}
}
