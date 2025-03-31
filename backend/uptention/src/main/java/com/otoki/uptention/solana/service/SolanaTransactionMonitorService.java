package com.otoki.uptention.solana.service;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.otoki.uptention.global.config.SolanaProperties;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class SolanaTransactionMonitorService {

	private final SolanaProperties solanaProperties;
	private final SolanaRpcService solanaRpcService;
	private final ObjectMapper objectMapper;

	private WebSocketSession webSocketSession;
	private final AtomicBoolean isRunning = new AtomicBoolean(false);

	// 이미 처리된 트랜잭션 서명을 추적 (중복 처리 방지)
	private final List<String> processedSignatures = new CopyOnWriteArrayList<>();
	// 회사 지갑의 토큰 계정 주소 저장 (토큰 타입별)
	private final Map<String, String> tokenAccountMap = new ConcurrentHashMap<>();

	@PostConstruct
	public void init() {
		log.info("Solana 트랜잭션 모니터링 서비스 초기화 중...");
		log.info("네트워크: {}", solanaProperties.getNetwork());
		log.info("RPC URL: {}", solanaProperties.getRpcUrl());
		log.info("WebSocket URL: {}", solanaProperties.getWebsocketUrl());
		log.info("회사 지갑 주소: {}", solanaProperties.getCompanyWallet());
		log.info("토큰 프로그램 ID: {}", solanaProperties.getTokenProgramId());
		log.info("워크 토큰 민트: {}", solanaProperties.getWorkTokenMint());

		// 워크 토큰 민트 주소가 설정되어 있는지 확인
		if (solanaProperties.getWorkTokenMint() == null || solanaProperties.getWorkTokenMint().isEmpty()) {
			log.warn("워크 토큰 민트 주소가 설정되지 않았습니다. SPL 토큰 모니터링이 비활성화됩니다.");
		}

		connectWebSocket();

		// 워크 토큰 민트가 설정된 경우에만 토큰 계정 검색
		if (solanaProperties.getWorkTokenMint() != null && !solanaProperties.getWorkTokenMint().isEmpty()) {
			findTokenAccounts();
		}
	}

	@PreDestroy
	public void cleanup() {
		disconnectWebSocket();
	}

	/**
	 * 회사 지갑이 소유한 토큰 계정 조회
	 */
	private void findTokenAccounts() {
		try {
			log.info("회사 지갑의 토큰 계정 조회 중...");

			// 회사 지갑이 소유한 토큰 계정 조회
			JsonNode response = solanaRpcService.getTokenAccountsByOwner(
				solanaProperties.getCompanyWallet(),
				Map.of("mint", solanaProperties.getWorkTokenMint()),
				Map.of("encoding", "jsonParsed")
			);

			if (response == null) {
				log.warn("토큰 계정 조회 결과가 null입니다");
				return;
			}

			if (response.has("error")) {
				log.warn("토큰 계정 조회 중 오류 발생: {}",
					response.path("error").path("message").asText("알 수 없는 오류"));
				return;
			}

			if (response.has("result") && response.get("result").has("value")) {
				JsonNode accounts = response.get("result").get("value");

				if (accounts.size() == 0) {
					log.warn("회사 지갑({})에 워크 토큰({})의 토큰 계정이 없습니다.",
						solanaProperties.getCompanyWallet(),
						solanaProperties.getWorkTokenMint());
					return;
				}

				for (JsonNode account : accounts) {
					if (account.has("pubkey")) {
						String tokenAccount = account.get("pubkey").asText();
						tokenAccountMap.put(solanaProperties.getWorkTokenMint(), tokenAccount);
						log.info("워크 토큰({})의 토큰 계정 찾음: {}",
							solanaProperties.getWorkTokenMint(), tokenAccount);

						// 토큰 계정 구독
						subscribeToTokenAccount(tokenAccount);
					}
				}
			}
		} catch (Exception e) {
			log.error("토큰 계정 조회 실패", e);
		}
	}

	/**
	 * WebSocket 연결을 설정하고 트랜잭션 구독 요청을 보냄
	 */
	private void connectWebSocket() {
		try {
			StandardWebSocketClient client = new StandardWebSocketClient();
			WebSocketHandler handler = new SolanaWebSocketHandler();

			String wsUrl = solanaProperties.getWebsocketUrl();
			webSocketSession = client.execute(handler, wsUrl).get();
			isRunning.set(true);

			// 회사 지갑 주소로 들어오는 SOL 트랜잭션 구독
			subscribeToAccountTransactions();

			// 워크 토큰 민트가 설정된 경우에만 토큰 프로그램 구독
			if (solanaProperties.getWorkTokenMint() != null && !solanaProperties.getWorkTokenMint().isEmpty()) {
				// SPL 토큰 프로그램 구독
				subscribeToTokenProgram();
			}

			log.info("Solana WebSocket 연결 성공");
		} catch (Exception e) {
			log.error("Solana WebSocket 연결 실패", e);
		}
	}

	/**
	 * 회사 지갑 주소로 들어오는 트랜잭션을 구독
	 */
	private void subscribeToAccountTransactions() {
		try {
			if (webSocketSession != null && webSocketSession.isOpen()) {
				// 회사 계정 구독 요청 메시지 생성
				Map<String, Object> params = Map.of(
					"jsonrpc", "2.0",
					"id", 1,
					"method", "accountSubscribe",
					"params", List.of(
						solanaProperties.getCompanyWallet(),
						Map.of("encoding", "jsonParsed", "commitment", "confirmed")
					)
				);

				String subscribeMessage = objectMapper.writeValueAsString(params);
				webSocketSession.sendMessage(new TextMessage(subscribeMessage));
				log.info("회사 지갑 주소 구독 요청 전송: {}", solanaProperties.getCompanyWallet());
			}
		} catch (Exception e) {
			log.error("트랜잭션 구독 요청 실패", e);
		}
	}

	/**
	 * SPL 토큰 프로그램을 구독
	 */
	private void subscribeToTokenProgram() {
		try {
			if (webSocketSession != null && webSocketSession.isOpen()) {
				// 토큰 프로그램 구독 요청 메시지 생성
				Map<String, Object> params = Map.of(
					"jsonrpc", "2.0",
					"id", 2,
					"method", "programSubscribe",
					"params", List.of(
						solanaProperties.getTokenProgramId(),
						Map.of("encoding", "jsonParsed", "commitment", "confirmed")
					)
				);

				String subscribeMessage = objectMapper.writeValueAsString(params);
				webSocketSession.sendMessage(new TextMessage(subscribeMessage));
				log.info("SPL 토큰 프로그램 구독 요청 전송: {}", solanaProperties.getTokenProgramId());
			}
		} catch (Exception e) {
			log.error("토큰 프로그램 구독 요청 실패", e);
		}
	}

	/**
	 * 특정 토큰 계정 구독
	 */
	private void subscribeToTokenAccount(String tokenAccount) {
		try {
			if (webSocketSession != null && webSocketSession.isOpen()) {
				// 토큰 계정 구독 요청 메시지 생성
				Map<String, Object> params = Map.of(
					"jsonrpc", "2.0",
					"id", 3,
					"method", "accountSubscribe",
					"params", List.of(
						tokenAccount,
						Map.of("encoding", "jsonParsed", "commitment", "confirmed")
					)
				);

				String subscribeMessage = objectMapper.writeValueAsString(params);
				webSocketSession.sendMessage(new TextMessage(subscribeMessage));
				log.info("토큰 계정 구독 요청 전송: {}", tokenAccount);
			}
		} catch (Exception e) {
			log.error("토큰 계정 구독 요청 실패", e);
		}
	}

	/**
	 * WebSocket 연결 종료
	 */
	private void disconnectWebSocket() {
		try {
			if (webSocketSession != null && webSocketSession.isOpen()) {
				webSocketSession.close();
				log.info("Solana WebSocket 연결 종료");
			}
		} catch (Exception e) {
			log.error("Solana WebSocket 연결 종료 실패", e);
		} finally {
			isRunning.set(false);
		}
	}

	/**
	 * WebSocket 핸들러 클래스
	 */
	private class SolanaWebSocketHandler extends TextWebSocketHandler {

		@Override
		public void afterConnectionEstablished(WebSocketSession session) {
			log.info("Solana WebSocket 연결 설정됨");
		}

		@Override
		protected void handleTextMessage(WebSocketSession session, TextMessage message) {
			try {
				String payload = message.getPayload();
				log.debug("수신된 WebSocket 메시지: {}", payload);

				JsonNode jsonNode = objectMapper.readTree(payload);

				// 구독 확인 응답 처리
				if (jsonNode.has("result")) {
					log.debug("구독 응답 수신: {}", jsonNode.get("result").asText());
					return;
				}

				// 실제 트랜잭션 데이터 처리
				if (jsonNode.has("params") && jsonNode.get("params").has("result")) {
					JsonNode result = jsonNode.get("params").get("result");
					log.info("WebSocket 알림 수신: {}", result.toString());

					// 트랜잭션 서명 추출
					String signature = extractSignatureFromNotification(result);

					// 서명이 있는 경우 (직접적인 트랜잭션 알림)
					if (signature != null) {
						log.info("추출된 트랜잭션 서명: {}", signature);

						// 이미 처리된 트랜잭션 제외
						if (processedSignatures.contains(signature)) {
							log.info("이미 처리된 트랜잭션: {}", signature);
							return;
						}

						// 트랜잭션 유형 확인 및 로깅
						boolean isSplToken = isSplTokenNotification(result);
						log.info("SPL 토큰 트랜잭션 여부: {}", isSplToken);

						if (isSplToken) {
							// 트랜잭션 세부 정보 조회 및 로깅만 수행
							logTransactionDetails(fetchTransactionDetails(signature), signature);
							// 처리된 트랜잭션으로 기록하여 중복 처리 방지
							processedSignatures.add(signature);
						} else {
							log.debug("SOL 트랜잭션 감지됨 (가스비용): {}", signature);
						}
					}
					// 서명이 없는 경우 (계정 상태 변경 알림)
					else {
						log.info("트랜잭션 서명이 없는 알림 수신 - 계정 상태 변경으로 간주");

						// 워크 토큰 계정 상태 변경 확인
						boolean isWorkTokenAccount = isWorkTokenAccountChange(result);

						if (isWorkTokenAccount) {
							log.info("워크 토큰 계정 상태 변경 감지됨");
						} else {
							log.debug("관련 없는 계정 상태 변경 알림 무시");
						}
					}
				} else {
					// 예상치 못한 형식의 메시지 로깅
					log.info("예상치 못한 형식의 WebSocket 메시지: {}", payload);
				}
			} catch (Exception e) {
				log.error("Solana WebSocket 메시지 처리 실패", e);
			}
		}

		@Override
		public void handleTransportError(WebSocketSession session, Throwable exception) {
			log.error("Solana WebSocket 전송 오류", exception);
		}

		@Override
		public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
			log.warn("Solana WebSocket 연결 종료됨: {}", status);

			// 연결이 종료되면 재연결 시도
			if (isRunning.get()) {
				try {
					Thread.sleep(5000); // 5초 대기 후 재연결
					connectWebSocket();
				} catch (InterruptedException e) {
					Thread.currentThread().interrupt();
				}
			}
		}
	}

	/**
	 * WebSocket 알림이 SPL 토큰 트랜잭션인지 확인
	 */
	private boolean isSplTokenNotification(JsonNode result) {
		try {
			// SPL 토큰 트랜잭션 확인 로직
			if (result.has("value")) {
				JsonNode value = result.get("value");

				// 프로그램 ID 확인
				if (value.has("owner") &&
					value.get("owner").asText().equals(solanaProperties.getTokenProgramId())) {
					return true;
				}

				// 데이터 확인
				if (value.has("data") && value.get("data").has("program")) {
					String program = value.get("data").path("program").asText("");
					if ("spl-token".equals(program)) {
						return true;
					}
				}

				// 토큰 계정 확인
				if (value.has("pubkey")) {
					String pubkey = value.get("pubkey").asText();
					// 회사의 토큰 계정인지 확인
					return tokenAccountMap.containsValue(pubkey);
				}
			}
		} catch (Exception e) {
			log.error("SPL 토큰 트랜잭션 확인 중 오류", e);
		}
		return false;
	}

	/**
	 * WebSocket 알림에서 트랜잭션 서명 추출
	 */
	private String extractSignatureFromNotification(JsonNode result) {
		try {
			// 여러 형태의 응답에서 서명 추출 시도

			// 1. 직접적인 서명 필드 확인
			if (result.has("signature")) {
				return result.get("signature").asText();
			}

			// 2. value 내의 서명 필드 확인
			if (result.has("value") && result.get("value").has("signature")) {
				return result.get("value").get("signature").asText();
			}

			// 3. value 내의 txid 필드 확인
			if (result.has("value") && result.get("value").has("txid")) {
				return result.get("value").get("txid").asText();
			}

			// 4. transaction 필드 확인
			if (result.has("transaction")) {
				return result.get("transaction").asText();
			}

			// 서명을 찾을 수 없는 경우
			log.debug("트랜잭션 서명을 찾을 수 없음: {}", result.toString());
		} catch (Exception e) {
			log.error("트랜잭션 서명 추출 실패", e);
		}
		return null;
	}

	/**
	 * Solana RPC를 통해 트랜잭션 세부 정보 조회
	 */
	private JsonNode fetchTransactionDetails(String signature) {
		try {
			log.info("트랜잭션 세부 정보 조회 시작: {}", signature);

			if (solanaRpcService == null) {
				log.error("SolanaRpcService가 주입되지 않았습니다.");
				return null;
			}

			log.info("SolanaRpcService.getTransaction 호출: {}", signature);
			JsonNode transactionData = solanaRpcService.getTransaction(signature);
			log.info("SolanaRpcService.getTransaction 호출 완료: {}", signature);

			if (transactionData == null) {
				log.warn("트랜잭션 데이터가 null입니다: {}", signature);
				return null;
			}

			if (transactionData.has("error")) {
				log.warn("트랜잭션 조회 중 오류 발생: {} - {}",
					signature,
					transactionData.path("error").path("message").asText("알 수 없는 오류"));
				return null;
			}

			log.info("트랜잭션 세부 정보 조회 성공: {}", signature);
			return transactionData;
		} catch (IOException e) {
			log.error("트랜잭션 세부 정보 조회 중 IOException 발생: {}", signature, e);
			return null;
		} catch (Exception e) {
			log.error("트랜잭션 세부 정보 처리 중 예상치 못한 오류: {}", signature, e);
			return null;
		}
	}

	/**
	 * WebSocket 알림이 워크 토큰 계정 상태 변경인지 확인
	 */
	private boolean isWorkTokenAccountChange(JsonNode result) {
		try {
			// 계정 정보가 포함되어 있는지 확인
			if (result.has("pubkey") && result.has("account")) {
				JsonNode account = result.get("account");

				// SPL 토큰 프로그램인지 확인
				if (account.has("owner") &&
					account.get("owner").asText().equals(solanaProperties.getTokenProgramId())) {

					// 데이터 필드에 SPL 토큰 정보가 있는지 확인
					if (account.has("data") && account.get("data").has("program") &&
						"spl-token".equals(account.get("data").path("program").asText())) {

						// 회사의 토큰 계정인지 확인
						String pubkey = result.get("pubkey").asText();
						String companyTokenAccount = tokenAccountMap.get(solanaProperties.getWorkTokenMint());

						if (pubkey.equals(companyTokenAccount)) {
							log.info("회사 워크 토큰 계정 상태 변경 감지: {}", pubkey);
							return true;
						}

						// 민트 확인 (계정 데이터에서)
						String mint = account.get("data").path("parsed").path("info").path("mint").asText("");
						if (mint.equals(solanaProperties.getWorkTokenMint())) {
							log.info("워크 토큰 관련 계정 상태 변경 감지: {}", pubkey);
							return true;
						}
					}
				}
			}
		} catch (Exception e) {
			log.error("토큰 계정 상태 변경 확인 중 오류", e);
		}
		return false;
	}

	/**
	 * 트랜잭션 데이터의 중요 정보를 로깅
	 */
	private void logTransactionDetails(JsonNode transactionData, String signature) {
		try {
			log.info("======== 트랜잭션 상세 정보 ========");
			log.info("트랜잭션 서명: {}", signature);

			if (transactionData == null) {
				log.info("트랜잭션 데이터가 없습니다");
				return;
			}

			JsonNode result = transactionData.get("result");
			if (result == null) {
				log.info("트랜잭션 데이터에 result 필드 없음");
				return;
			}

			// 블록 정보
			if (result.has("slot")) {
				log.info("블록 번호: {}", result.get("slot").asText());
			}

			if (result.has("blockTime")) {
				long blockTime = result.get("blockTime").asLong();
				Date date = new Date(blockTime * 1000L);
				log.info("블록 타임스탬프: {} ({})", blockTime,
					new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(date));
			}

			// 로그 메시지
			if (result.has("meta") && result.get("meta").has("logMessages")) {
				JsonNode logMessages = result.get("meta").get("logMessages");
				log.info("로그 메시지:");
				for (JsonNode message : logMessages) {
					log.info(" - {}", message.asText());
				}
			}

			// 토큰 잔액 변화
			if (result.has("meta")) {
				JsonNode meta = result.get("meta");
				if (meta.has("preTokenBalances") && meta.has("postTokenBalances")) {
					JsonNode preBalances = meta.get("preTokenBalances");
					JsonNode postBalances = meta.get("postTokenBalances");

					log.info("토큰 잔액 변화:");
					for (int i = 0; i < preBalances.size(); i++) {
						JsonNode pre = preBalances.get(i);

						// 같은 인덱스의 post 잔액 찾기
						JsonNode post = null;
						for (int j = 0; j < postBalances.size(); j++) {
							if (postBalances.get(j).get("accountIndex").asInt() ==
								pre.get("accountIndex").asInt()) {
								post = postBalances.get(j);
								break;
							}
						}

						if (post != null) {
							String owner = pre.has("owner") ? pre.get("owner").asText() : "알 수 없음";
							String mint = pre.has("mint") ? pre.get("mint").asText() : "알 수 없음";
							String preAmount = pre.path("uiTokenAmount").path("uiAmountString").asText("0");
							String postAmount = post.path("uiTokenAmount").path("uiAmountString").asText("0");

							log.info(" - 계정: {}, 민트: {}, 이전: {}, 이후: {}",
								owner, mint, preAmount, postAmount);
						}
					}
				}
			}

			log.info("================================");
		} catch (Exception e) {
			log.error("트랜잭션 상세 정보 로깅 중 오류", e);
		}
	}

	/**
	 * 지나치게 오래된 처리 완료된 트랜잭션 서명 정리 (메모리 관리)
	 */
	@Scheduled(fixedDelay = 60000) // 60초마다 실행
	public void cleanupProcessedSignatures() {
		try {
			if (processedSignatures.size() > 1000) {
				log.info("오래된 트랜잭션 서명 정리 중... (현재 크기: {})", processedSignatures.size());
				processedSignatures.subList(0, 500).clear();
				log.info("오래된 트랜잭션 서명 정리 완료 (현재 크기: {})", processedSignatures.size());
			}
		} catch (Exception e) {
			log.error("트랜잭션 서명 정리 실패", e);
		}
	}

	/* 주문 처리 관련 코드는 주석 처리

	// 주문 및 결제 처리 부분은 제외하고 트랜잭션 감지와 로깅만 남깁니다

	private void processSplTokenTransaction(String signature) {
		// 트랜잭션 감지 및 로깅 중심으로 코드 수정
		try {
			log.info("워크 토큰 트랜잭션 감지: {}", signature);
			JsonNode transactionData = fetchTransactionDetails(signature);

			if (transactionData != null) {
				// 트랜잭션 상세 정보 로깅
				logTransactionDetails(transactionData, signature);
				processedSignatures.add(signature);
			}
		} catch (Exception e) {
			log.error("트랜잭션 처리 중 오류: {}", signature, e);
		}
	}
	*/
}