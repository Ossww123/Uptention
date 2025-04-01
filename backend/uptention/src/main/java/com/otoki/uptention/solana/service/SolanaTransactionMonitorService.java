package com.otoki.uptention.solana.service;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.ws.SubscriptionWebSocketClient;
import org.p2p.solanaj.ws.listeners.NotificationEventListener;
import org.springframework.stereotype.Service;

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
	private final PaymentProcessService paymentProcessService;

	private RpcClient rpcClient;
	private SubscriptionWebSocketClient webSocketClient;
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

		// 초기화 및 WebSocket 연결
		initializeRpcClient();

		// 워크 토큰 민트가 설정된 경우에만 토큰 계정 검색
		if (solanaProperties.getWorkTokenMint() != null && !solanaProperties.getWorkTokenMint().isEmpty()) {
			findTokenAccounts();
		}

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
					}
				}
			}
		} catch (Exception e) {
			log.error("토큰 계정 조회 실패", e);
		}
	}

	/**
	 * SolanaJ 라이브러리를 사용하여 WebSocket 연결 설정
	 */
	private void connectWebSocket() {
		try {
			// WebSocket 클라이언트 생성
			webSocketClient = SubscriptionWebSocketClient.getExactPathInstance(solanaProperties.getWebsocketUrl());

			try {
				// 연결이 될 때까지 잠시 대기
				Thread.sleep(2000);

				if (webSocketClient.isOpen()) {
					log.info("Solana WebSocket 연결 성공");
					isRunning.set(true);

					// 로그 구독 방식으로 변경 - 회사 지갑에 관련된 모든 로그 구독
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
			Thread.sleep(5000); // 5초 대기 후 재연결
			log.info("WebSocket 재연결 시도 중...");
			connectWebSocket();
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
	}

	/**
	 * 로그 구독 방식으로 회사 지갑 관련 로그 구독
	 */
	private void subscribeToLogs() {
		try {
			if (webSocketClient != null && webSocketClient.isOpen()) {
				log.info("회사 지갑 주소 관련 로그 구독 요청 전송: {}", solanaProperties.getCompanyWallet());

				// 회사 지갑 주소를 언급하는 모든 로그 구독
				webSocketClient.logsSubscribe(solanaProperties.getCompanyWallet(), new NotificationEventListener() {
					@Override
					public void onNotificationEvent(Object data) {
						try {
							log.info("로그 알림 수신: {}", objectMapper.writeValueAsString(data));

							// 로그 데이터에서 트랜잭션 서명 추출
							@SuppressWarnings("unchecked")
							Map<String, Object> dataMap = (Map<String, Object>)data;

							if (dataMap.containsKey("signature")) {
								String signature = dataMap.get("signature").toString();
								log.info("트랜잭션 감지: {}", signature);

								// 이미 처리된 트랜잭션 제외
								if (processedSignatures.contains(signature)) {
									log.info("이미 처리된 트랜잭션: {}", signature);
									return;
								}

								// 트랜잭션 세부 정보 조회 및 로깅
								JsonNode transactionData = fetchTransactionDetails(signature);
								if (transactionData != null) {
									logTransactionDetails(transactionData, signature);
									processedSignatures.add(signature);
								}
							}
						} catch (Exception e) {
							log.error("로그 알림 처리 실패", e);
						}
					}
				});

				log.info("로그 구독 완료");

				// 토큰 민트 주소가 있는 경우 해당 민트 관련 로그도 구독
				if (solanaProperties.getWorkTokenMint() != null && !solanaProperties.getWorkTokenMint().isEmpty()) {
					webSocketClient.logsSubscribe(solanaProperties.getWorkTokenMint(), new NotificationEventListener() {
						@Override
						public void onNotificationEvent(Object data) {
							try {
								log.info("워크 토큰 민트 관련 로그 알림 수신: {}", objectMapper.writeValueAsString(data));

								// 로그 데이터에서 트랜잭션 서명 추출
								@SuppressWarnings("unchecked")
								Map<String, Object> dataMap = (Map<String, Object>)data;

								if (dataMap.containsKey("signature")) {
									String signature = dataMap.get("signature").toString();
									log.info("워크 토큰 트랜잭션 감지: {}", signature);

									// 이미 처리된 트랜잭션 제외
									if (processedSignatures.contains(signature)) {
										log.info("이미 처리된 트랜잭션: {}", signature);
										return;
									}

									// 트랜잭션 세부 정보 조회 및 로깅
									JsonNode transactionData = fetchTransactionDetails(signature);
									if (transactionData != null) {
										logTransactionDetails(transactionData, signature);
										processedSignatures.add(signature);
									}
								}
							} catch (Exception e) {
								log.error("워크 토큰 로그 알림 처리 실패", e);
							}
						}
					});

					log.info("워크 토큰 민트 로그 구독 완료");
				}
			} else {
				log.warn("WebSocket 연결이 되어있지 않아 구독 요청을 보낼 수 없습니다");
			}
		} catch (Exception e) {
			log.error("로그 구독 요청 실패", e);
		}
	}

	/**
	 * WebSocket 연결 종료
	 */
	private void disconnectWebSocket() {
		try {
			if (webSocketClient != null && webSocketClient.isOpen()) {
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

			// 메모 필드 확인 (주문 ID 확인을 위해)
			if (result.has("transaction") && result.get("transaction").has("message")) {
				JsonNode message = result.get("transaction").get("message");
				if (message.has("instructions")) {
					JsonNode instructions = message.get("instructions");
					for (JsonNode instruction : instructions) {
						// Memo 프로그램 ID 확인 (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr)
						if (instruction.has("programId") &&
							instruction.get("programId")
								.asText()
								.equals("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")) {

							if (instruction.has("data")) {
								String memoData = instruction.get("data").asText();
								log.info("트랜잭션 메모: {}", memoData);

								// 메모에서 주문 ID 추출 (ORDER_123 형식 예상)
								if (memoData.startsWith("ORDER_")) {
									String orderId = memoData.substring(6);
									log.info("주문 ID 감지: {}", orderId);

									// 결제 처리 서비스 호출
									boolean processed = paymentProcessService.processPaymentSuccess(orderId, signature);
									if (processed) {
										log.info("주문 ID({})의 결제가 성공적으로 처리되었습니다.", orderId);
									} else {
										log.warn("주문 ID({})의 결제 처리에 실패했습니다.", orderId);
									}
								}
							}
						}
					}
				}
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

							// 워크 토큰인지 확인
							if (mint.equals(solanaProperties.getWorkTokenMint())) {
								log.info("워크 토큰 거래 감지!");

								// 회사 지갑으로 토큰이 전송되었는지 확인
								if (owner.equals(solanaProperties.getCompanyWallet())) {
									double preBal = Double.parseDouble(preAmount);
									double postBal = Double.parseDouble(postAmount);

									if (postBal > preBal) {
										double amount = postBal - preBal;
										log.info("회사 지갑으로 워크 토큰 {} 수신됨", amount);
									}
								}
							}
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

	/**
	 * WebSocket 연결 상태 확인 및 재연결
	 */
	public void checkWebSocketConnection() {
		try {
			if (isRunning.get() && (webSocketClient == null || !webSocketClient.isOpen())) {
				log.warn("WebSocket 연결이 끊어졌습니다. 재연결 시도 중...");
				connectWebSocket();
			}
		} catch (Exception e) {
			log.error("WebSocket 연결 상태 확인 중 오류", e);
		}
	}
}