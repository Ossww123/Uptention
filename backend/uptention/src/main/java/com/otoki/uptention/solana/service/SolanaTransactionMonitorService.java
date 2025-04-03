package com.otoki.uptention.solana.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.ws.SubscriptionWebSocketClient;
import org.p2p.solanaj.ws.listeners.NotificationEventListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.global.config.RabbitMQConfig;
import com.otoki.uptention.global.config.SolanaProperties;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.solana.event.PaymentFailedEvent;
import com.otoki.uptention.solana.event.PaymentSuccessEvent;

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
	private final RabbitTemplate rabbitTemplate;
	private final OrderService orderService;
	private final OrderItemService orderItemService;

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

	public boolean isWebSocketConnected() {
		return webSocketClient != null && webSocketClient.isOpen();
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
	 * 로그 구독 방식으로 워크토큰 로그 구독
	 */
	private void subscribeToLogs() {
		try {
			if (webSocketClient != null && webSocketClient.isOpen()) {
				log.info("워크토큰 민트 주소 로그 구독 요청 전송: {}", solanaProperties.getCompanyWallet());

				// 토큰 민트 주소 로그 구독
				webSocketClient.logsSubscribe(solanaProperties.getWorkTokenMint(), new NotificationEventListener() {
					@Override
					public void onNotificationEvent(Object data) {
						try {
							log.info("워크토큰 민트 관련 로그 알림 수신: {}", objectMapper.writeValueAsString(data));

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

								// WebSocket에서 받은 로그 정보 사용
								if (dataMap.containsKey("logs") && dataMap.get("logs") != null) {
									@SuppressWarnings("unchecked")
									List<String> logs = (List<String>)dataMap.get("logs");

									// WebSocket 알림에서 받은 로그 정보로 처리
									processTransactionWithLogs(signature, logs);
									processedSignatures.add(signature);
								} else {
									// 로그 정보가 없는 경우 RPC 호출
									JsonNode transactionData = fetchTransactionDetails(signature);
									if (transactionData != null) {
										logTransactionDetails(transactionData, signature);
										processedSignatures.add(signature);
									}
								}
							}
						} catch (Exception e) {
							log.error("워크 토큰 로그 알림 처리 실패", e);
						}
					}
				});

				log.info("워크 토큰 민트 로그 구독 완료");
			} else {
				log.warn("WebSocket 연결이 되어있지 않아 구독 요청을 보낼 수 없습니다");
			}
		} catch (Exception e) {
			log.error("로그 구독 요청 실패", e);
		}
	}

	/**
	 * WebSocket에서 받은 로그로 트랜잭션 처리
	 */
	private void processTransactionWithLogs(String signature, List<String> logs) {
		log.info("======== 트랜잭션 상세 정보 (WebSocket) ========");
		log.info("트랜잭션 서명: {}", signature);

		if (logs == null || logs.isEmpty()) {
			log.info("로그 메시지를 찾을 수 없습니다");
			return;
		}

		// 로그 출력 및 주문 ID 찾기
		String orderId = null;
		for (String logMessage : logs) {
			log.info("로그 메시지: {}", logMessage);

			// Memo 프로그램 로그에서 주문 ID 추출
			if (logMessage.contains("Memo") && logMessage.contains("ORDER_")) {
				int startIdx = logMessage.indexOf("ORDER_");
				if (startIdx != -1) {
					int endIdx = logMessage.lastIndexOf("\"");
					if (endIdx > startIdx) {
						orderId = logMessage.substring(startIdx, endIdx);
					} else {
						orderId = logMessage.substring(startIdx);
					}
					log.info("주문 ID 감지: {}", orderId);
					break;
				}
			}
		}

		// 주문 ID가 추출된 경우 처리
		if (orderId != null && orderId.startsWith("ORDER_")) {
			String orderIdOnly = orderId.substring(6); // "ORDER_" 제거

			// 주문 처리를 위한 시간 정보는 현재 시간으로 대체 (블록 시간 정보가 없으므로)
			long currentBlockTime = Instant.now().getEpochSecond();

			// 주문 처리 로직 호출
			processOrder(orderIdOnly, currentBlockTime, null, signature);
		}

		log.info("================================");
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

			// 블록 정보 로깅
			long blockTime = 0;
			if (result.has("blockTime")) {
				blockTime = result.get("blockTime").asLong();
				Date date = new Date(blockTime * 1000L);
				log.info("블록 타임스탬프: {} ({})", blockTime,
					new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(date));
			}

			// logMessages에서 주문 ID 추출
			if (result.has("meta") && result.get("meta").has("logMessages")) {
				JsonNode logMessages = result.get("meta").get("logMessages");
				String orderId = null;

				for (JsonNode logMessage : logMessages) {
					String message = logMessage.asText();
					log.info("로그 메시지: {}", message);

					// Memo 프로그램 로그에서 주문 ID 추출
					if (message.contains("Memo") && message.contains("ORDER_")) {
						// "Program log: Memo (len 9): \"ORDER_155\"" 형식에서 추출
						int startIdx = message.indexOf("ORDER_");
						if (startIdx != -1) {
							int endIdx = message.lastIndexOf("\"");
							if (endIdx > startIdx) {
								orderId = message.substring(startIdx, endIdx);
							} else {
								orderId = message.substring(startIdx);
							}
							log.info("주문 ID 감지: {}", orderId);
							break;
						}
					}
				}

				// 주문 ID가 추출된 경우에만 처리 진행
				if (orderId != null && orderId.startsWith("ORDER_")) {
					String orderIdOnly = orderId.substring(6); // "ORDER_" 제거
					processOrder(orderIdOnly, blockTime, result, signature);
				} else {
					log.info("주문 ID를 찾을 수 없습니다");
				}
			} else {
				log.info("로그 메시지를 찾을 수 없습니다");
			}

			log.info("================================");
		} catch (Exception e) {
			log.error("트랜잭션 상세 정보 로깅 중 오류", e);
			e.printStackTrace(); // 스택 트레이스 출력
		}
	}

	// 주문 처리 로직을 별도 메소드로 분리
	private void processOrder(String orderId, long blockTime, JsonNode result, String signature) {
		try {
			// 1. 주문 ID 유효성 검증
			Integer orderIdNum = Integer.parseInt(orderId);
			Order order;
			try {
				order = orderService.getOrderById(orderIdNum);
			} catch (CustomException e) {
				log.error("주문을 찾을 수 없음: {}", orderId);
				publishPaymentFailedEvent(orderId, "주문을 찾을 수 없음", signature);
				return;
			}

			// 2. 주문 상태 검증
			if (!OrderStatus.PAYMENT_PENDING.equals(order.getStatus())) {
				String reason = "유효하지 않은 주문 상태: " + order.getStatus();
				log.warn("주문 ID({})의 상태가 결제 대기 상태가 아닙니다: {}", orderIdNum, order.getStatus());
				publishPaymentFailedEvent(orderId, reason, signature);
				return;
			}

			// 3. 트랜잭션 시간 검증 (blockTime이 유효한 경우에만)
			if (blockTime > 0) {
				LocalDateTime orderCreatedAt = order.getCreatedAt();
				LocalDateTime transactionTime = LocalDateTime.ofInstant(
					Instant.ofEpochSecond(blockTime), ZoneId.systemDefault());

				if (transactionTime.isBefore(orderCreatedAt)) {
					String reason = "트랜잭션 시간이 주문 생성 시간보다 이전임";
					log.warn("트랜잭션 시간이 주문 생성 시간보다 이전입니다: 주문 ID={}", orderIdNum);
					publishPaymentFailedEvent(orderId, reason, signature);
					return;
				}
			}

			// 4. 주문 금액 계산
			List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(orderIdNum);
			int orderTotalAmount = orderItems.stream()
				.mapToInt(OrderItem::getTotalPrice)
				.sum();

			// 5. 트랜잭션 금액 확인 (result가 있는 경우에만)
			double transactionAmount = orderTotalAmount; // 기본값으로 주문 금액 사용

			if (result != null && result.has("meta")) {
				JsonNode meta = result.get("meta");
				if (meta.has("preTokenBalances") && meta.has("postTokenBalances")) {
					JsonNode preBalances = meta.get("preTokenBalances");
					JsonNode postBalances = meta.get("postTokenBalances");

					for (int i = 0; i < preBalances.size(); i++) {
						JsonNode pre = preBalances.get(i);
						if (!pre.has("owner") ||
							!pre.get("owner")
								.asText()
								.equals(solanaProperties.getCompanyWallet())) {
							continue;
						}

						// 같은 인덱스의 post 잔액 찾기
						for (int j = 0; j < postBalances.size(); j++) {
							JsonNode post = postBalances.get(j);
							if (post.get("accountIndex").asInt() == pre.get("accountIndex")
								.asInt()) {
								// 워크 토큰인지 확인
								if (pre.has("mint") &&
									pre.get("mint")
										.asText()
										.equals(solanaProperties.getWorkTokenMint())) {
									double preAmount = Double.parseDouble(
										pre.path("uiTokenAmount")
											.path("uiAmountString")
											.asText("0"));
									double postAmount = Double.parseDouble(
										post.path("uiTokenAmount")
											.path("uiAmountString")
											.asText("0"));

									// 잔액 증가량 계산 (회사 지갑으로 전송된 금액)
									transactionAmount = postAmount - preAmount;
									log.info("주문 ID({})의 결제 금액: {}", orderIdNum,
										transactionAmount);
								}
							}
						}
					}
				}
			} else {
				log.info("주문 ID({})의 결제 금액: {} (기본값 사용)", orderIdNum, transactionAmount);
			}

			// 6. 금액 검증 (RPC 결과가 있는 경우에만)
			if (result != null && Math.abs(transactionAmount - orderTotalAmount) > 0.001) {
				String reason = String.format(
					"금액이 일치하지 않음: 주문=%d, 트랜잭션=%.2f", orderTotalAmount, transactionAmount);
				log.warn("주문 ID({})의 금액이 일치하지 않습니다: 주문={}, 트랜잭션={}",
					orderIdNum, orderTotalAmount, transactionAmount);
				publishPaymentFailedEvent(orderId, reason, signature);
				return;
			}

			// 7. 모든 검증 통과 시 결제 완료 이벤트 발행
			PaymentSuccessEvent event = PaymentSuccessEvent.builder()
				.orderId(orderIdNum)
				.userId(order.getUser().getId())
				.totalAmount(new BigDecimal(orderTotalAmount))
				.completedAt(System.currentTimeMillis())
				.transactionSignature(signature)
				.build();

			rabbitTemplate.convertAndSend(RabbitMQConfig.PAYMENT_EXCHANGE,
				RabbitMQConfig.PAYMENT_COMPLETED_KEY, event);
			log.info("주문 ID({})의 결제 완료 이벤트를 발행했습니다.", orderIdNum);

		} catch (NumberFormatException e) {
			log.error("유효하지 않은 주문 ID 형식: {}", orderId, e);
			publishPaymentFailedEvent(orderId, "유효하지 않은 주문 ID 형식", signature);
		} catch (Exception e) {
			log.error("결제 처리 중 예상치 못한 오류: {}", orderId, e);
			publishPaymentFailedEvent(orderId, "결제 처리 중 시스템 오류: " + e.getMessage(), signature);
		}
	}

	/**
	 * 결제 실패 이벤트 발행
	 */
	private void publishPaymentFailedEvent(String orderId, String reason, String signature) {
		try {
			// 주문 조회
			Integer orderIdNum = Integer.parseInt(orderId);
			Order order;
			try {
				order = orderService.getOrderById(orderIdNum);
			} catch (CustomException e) {
				log.error("결제 실패 이벤트 발행 중 주문 조회 실패: {}", orderId, e);
				return;
			}

			// 결제 실패 이벤트 생성
			PaymentFailedEvent event = PaymentFailedEvent.builder()
				.orderId(orderIdNum)
				.userId(order.getUser().getId())
				.failedAt(System.currentTimeMillis())
				.reason(reason)
				.transactionSignature(signature)
				.build();

			// RabbitMQ에 이벤트 발행
			rabbitTemplate.convertAndSend(RabbitMQConfig.PAYMENT_EXCHANGE, RabbitMQConfig.PAYMENT_FAILED_KEY, event);
			log.info("결제 실패 이벤트 발행: 주문 ID={}, 사유={}", event.getOrderId(), event.getReason());
		} catch (Exception e) {
			log.error("결제 실패 이벤트 발행 중 오류", e);
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