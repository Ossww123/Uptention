package com.otoki.uptention.solana.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
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
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.global.config.SolanaProperties;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.solana.event.PaymentCompletedEvent;

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
	private final OrderService orderService;
	private final OrderItemService orderItemService;
	private final RabbitTemplate rabbitTemplate;
	private final ObjectMapper objectMapper;

	private WebSocketSession webSocketSession;
	private final AtomicBoolean isRunning = new AtomicBoolean(false);

	// 대기 중인 주문을 메모리에 캐싱 (성능 최적화)
	private final Map<Integer, Order> pendingOrdersCache = new ConcurrentHashMap<>();
	// 이미 처리된 트랜잭션 서명을 추적 (중복 처리 방지)
	private final List<String> processedSignatures = new CopyOnWriteArrayList<>();

	@PostConstruct
	public void init() {
		connectWebSocket();
		// 시작 시 대기 중인 주문을 메모리에 로드
		refreshPendingOrders();
	}

	@PreDestroy
	public void cleanup() {
		disconnectWebSocket();
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

			// 회사 지갑 주소로 들어오는 트랜잭션 구독
			subscribeToAccountTransactions();

			log.info("Solana WebSocket 연결 성공");
		} catch (Exception e) {
			log.error("Solana WebSocket 연결 실패", e);
			// 연결 실패 시 재시도 로직 (생략)
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
	 * 주기적으로 대기 중인 주문을 메모리에 로드
	 */
	@Scheduled(fixedDelay = 60000) // 60초마다 실행
	public void refreshPendingOrders() {
		try {
			log.debug("대기 중인 주문 목록 갱신 중...");

			List<Order> pendingOrders = orderService.getOrdersByStatus(OrderStatus.PAYMENT_PENDING);

			// 캐시 업데이트
			pendingOrdersCache.clear();
			for (Order order : pendingOrders) {
				pendingOrdersCache.put(order.getId(), order);
			}

			log.debug("대기 중인 주문 {}건 메모리에 로드됨", pendingOrders.size());

			// 지나치게 오래된 처리 완료된 트랜잭션 서명 정리 (메모리 관리)
			if (processedSignatures.size() > 1000) {
				processedSignatures.subList(0, 500).clear();
			}
		} catch (Exception e) {
			log.error("대기 중인 주문 갱신 실패", e);
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
				JsonNode jsonNode = objectMapper.readTree(payload);

				// 구독 확인 응답 처리
				if (jsonNode.has("result")) {
					log.debug("구독 응답 수신: {}", jsonNode.get("result").asText());
					return;
				}

				// 실제 트랜잭션 데이터 처리
				if (jsonNode.has("params") && jsonNode.get("params").has("result")) {
					JsonNode result = jsonNode.get("params").get("result");

					// 트랜잭션 정보 추출
					if (result.has("value") && result.get("value").has("data")) {
						// 트랜잭션 서명 추출
						String signature = extractSignatureFromNotification(result);

						// 이미 처리된 트랜잭션인지 확인
						if (signature != null && !processedSignatures.contains(signature)) {
							// 트랜잭션 처리
							processTransaction(signature);
						}
					}
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
	 * WebSocket 알림에서 트랜잭션 서명 추출
	 */
	private String extractSignatureFromNotification(JsonNode result) {
		try {
			// 이 부분은 실제 Solana WebSocket 응답 구조에 맞게 조정 필요
			if (result.has("transaction")) {
				return result.get("transaction").asText();
			}
		} catch (Exception e) {
			log.error("트랜잭션 서명 추출 실패", e);
		}
		return null;
	}

	/**
	 * 트랜잭션 처리
	 */
	private void processTransaction(String signature) {
		try {
			log.info("트랜잭션 처리 중: {}", signature);

			// Solana RPC를 통해 트랜잭션 세부 정보 조회
			JsonNode transactionData = fetchTransactionDetails(signature);

			if (transactionData == null || !isValidTransaction(transactionData)) {
				log.debug("유효하지 않은 트랜잭션: {}", signature);
				return;
			}

			// 메모 필드에서 주문 ID 추출
			String memo = extractMemoFromTransaction(transactionData);
			if (memo == null || !memo.startsWith("ORDER_")) {
				log.debug("주문 관련 메모가 없는 트랜잭션: {}", signature);
				return;
			}

			// 주문 ID 파싱
			Integer orderId = parseOrderIdFromMemo(memo);
			if (orderId == null) {
				log.warn("메모에서 주문 ID 파싱 실패: {}", memo);
				return;
			}

			// 캐시에서 주문 조회
			Order order = pendingOrdersCache.get(orderId);
			if (order == null) {
				// 캐시에 없는 경우 DB에서 직접 조회
				try {
					Order foundOrder = orderService.getOrderById(orderId);
					// 주문이 결제 대기 상태인지 확인
					if (OrderStatus.PAYMENT_PENDING.equals(foundOrder.getStatus())) {
						order = foundOrder;
						pendingOrdersCache.put(orderId, order);
					} else {
						log.debug("대기 중인 주문이 아님: {}", orderId);
						return;
					}
				} catch (CustomException e) {
					// 주문을 찾지 못한 경우
					log.debug("주문을 찾을 수 없음: {}", orderId);
					return;
				}
			}

			// 결제 금액 확인
			BigDecimal amount = extractAmountFromTransaction(transactionData);
			BigDecimal orderTotal = calculateOrderTotal(order);
			if (amount.compareTo(orderTotal) < 0) {
				log.warn("결제 금액 부족: 예상={}, 실제={}", orderTotal, amount);
				return;
			}

			// 결제 완료 처리
			order.updateStatus(OrderStatus.PAYMENT_COMPLETED);
			orderService.saveOrder(order);

			// 중복 처리 방지를 위해 처리된 트랜잭션 서명 기록
			processedSignatures.add(signature);

			// 캐시에서 제거
			pendingOrdersCache.remove(orderId);

			// RabbitMQ를 통해 결제 완료 이벤트 발행
			publishPaymentCompletedEvent(order);

			log.info("주문 ID {} 결제 완료 처리됨 (트랜잭션: {})", orderId, signature);
		} catch (Exception e) {
			log.error("트랜잭션 처리 중 오류 발생: " + signature, e);
		}
	}

	/**
	 * Solana RPC를 통해 트랜잭션 세부 정보 조회
	 */
	private JsonNode fetchTransactionDetails(String signature) {
		try {
			// SolanaRpcService를 주입받아 사용
			if (solanaRpcService == null) {
				log.error("SolanaRpcService가 주입되지 않았습니다.");
				return null;
			}

			// 트랜잭션 서명을 이용해 트랜잭션 세부 정보 조회
			JsonNode transactionData = solanaRpcService.getTransaction(signature);

			// 트랜잭션 데이터 유효성 간단 확인
			if (transactionData == null) {
				log.warn("트랜잭션 데이터를 가져오지 못했습니다: {}", signature);
				return null;
			}

			// 오류가 있는 경우 체크
			if (transactionData.has("error")) {
				log.warn("트랜잭션 조회 중 오류 발생: {} - {}",
					signature,
					transactionData.path("error").path("message").asText("알 수 없는 오류"));
				return null;
			}

			log.debug("트랜잭션 세부 정보 조회 성공: {}", signature);
			return transactionData;
		} catch (IOException e) {
			log.error("트랜잭션 세부 정보 조회 실패: " + signature, e);
			return null;
		} catch (Exception e) {
			log.error("트랜잭션 세부 정보 처리 중 예상치 못한 오류: " + signature, e);
			return null;
		}
	}

	/**
	 * 트랜잭션이 유효한지 확인
	 */
	private boolean isValidTransaction(JsonNode transactionData) {
		try {
			// 트랜잭션이 성공적으로 처리되었는지 확인
			if (transactionData.has("result") &&
				transactionData.get("result").has("meta") &&
				transactionData.get("result").get("meta").has("err")) {

				JsonNode err = transactionData.get("result").get("meta").get("err");
				return err == null || err.isNull();
			}
		} catch (Exception e) {
			log.error("트랜잭션 유효성 검사 중 오류", e);
		}
		return false;
	}

	/**
	 * 트랜잭션에서 메모 필드 추출
	 */
	private String extractMemoFromTransaction(JsonNode transactionData) {
		try {
			JsonNode result = transactionData.get("result");
			if (result != null && result.has("meta") && result.get("meta").has("logMessages")) {
				JsonNode logMessages = result.get("meta").get("logMessages");

				// 로그 메시지를 순회하며 메모 찾기
				for (JsonNode logMessage : logMessages) {
					String message = logMessage.asText();

					// 메모 프로그램 관련 로그 검사
					if (message.contains("Program log: Memo") ||
						message.contains("Program log: Instruction: Memo")) {

						// 메모 내용 추출
						int startIndex = message.indexOf("Memo") + 5;
						String memoContent = message.substring(startIndex).trim();

						// 괄호 제거
						if (memoContent.startsWith("(") && memoContent.endsWith(")")) {
							memoContent = memoContent.substring(1, memoContent.length() - 1);
						}

						return memoContent;
					}
				}
			}

			// 트랜잭션 명령어를 직접 확인
			if (result != null && result.has("transaction") &&
				result.get("transaction").has("message") &&
				result.get("transaction").get("message").has("instructions")) {

				JsonNode instructions = result.get("transaction").get("message").get("instructions");

				// 메모 프로그램 명령어 찾기
				for (JsonNode instruction : instructions) {
					// 메모 프로그램 ID 확인
					if (instruction.has("programId") &&
						instruction.get("programId").asText().equals("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")) {

						// 데이터 필드에서 메모 내용 디코딩
						if (instruction.has("data")) {
							String base64Data = instruction.get("data").asText();
							byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
							return new String(decodedBytes);
						}
					}
				}
			}
		} catch (Exception e) {
			log.error("메모 필드 추출 중 오류", e);
		}

		return null;
	}

	/**
	 * 메모에서 주문 ID 파싱
	 */
	private Integer parseOrderIdFromMemo(String memo) {
		try {
			if (memo != null && memo.startsWith("ORDER_")) {
				String orderIdStr = memo.substring(6);
				return Integer.parseInt(orderIdStr);
			}
		} catch (NumberFormatException e) {
			log.warn("주문 ID 파싱 실패: {}", memo);
		}
		return null;
	}

	/**
	 * 트랜잭션에서 결제 금액 추출
	 */
	private BigDecimal extractAmountFromTransaction(JsonNode transactionData) {
		try {
			JsonNode result = transactionData.get("result");
			if (result != null && result.has("meta")) {
				JsonNode meta = result.get("meta");

				// 사전 잔액과 사후 잔액의 차이로 결제 금액 계산
				if (meta.has("preBalances") && meta.has("postBalances")) {
					JsonNode preBalances = meta.get("preBalances");
					JsonNode postBalances = meta.get("postBalances");

					// 발신자 잔액 변화 (일반적으로 0번 인덱스가 발신자)
					long preBalance = preBalances.get(0).asLong();
					long postBalance = postBalances.get(0).asLong();

					// 수수료 고려
					long fee = meta.has("fee") ? meta.get("fee").asLong() : 0;

					// 발신 금액 = (사전 잔액 - 사후 잔액 - 수수료)
					long lamportsAmount = preBalance - postBalance - fee;

					// Lamports를 SOL로 변환 (1 SOL = 10^9 lamports)
					return BigDecimal.valueOf(lamportsAmount).divide(BigDecimal.valueOf(1_000_000_000L));
				}
			}
		} catch (Exception e) {
			log.error("결제 금액 추출 중 오류", e);
		}

		return BigDecimal.ZERO;
	}

	/**
	 * RabbitMQ를 통해 결제 완료 이벤트 발행
	 */
	private void publishPaymentCompletedEvent(Order order) {
		try {
			PaymentCompletedEvent event = new PaymentCompletedEvent();
			event.setOrderId(order.getId());
			event.setUserId(order.getUser().getId());
			event.setTotalAmount(calculateOrderTotal(order));
			event.setCompletedAt(System.currentTimeMillis());

			rabbitTemplate.convertAndSend("payment.exchange", "payment.completed", event);
			log.info("결제 완료 이벤트 발행: 주문 ID {}", order.getId());
		} catch (Exception e) {
			log.error("결제 완료 이벤트 발행 실패", e);
		}
	}

	/**
	 * 주문의 총 금액을 계산하는 헬퍼 메서드
	 */
	private BigDecimal calculateOrderTotal(Order order) {
		// OrderItem 리포지토리를 주입받아 사용
		List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(order.getId());

		if (orderItems == null || orderItems.isEmpty()) {
			return BigDecimal.ZERO;
		}

		int total = orderItems.stream()
			.mapToInt(OrderItem::getTotalPrice)
			.sum();

		return new BigDecimal(total);
	}
}