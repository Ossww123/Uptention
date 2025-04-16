package com.otoki.uptention.solana.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.global.config.RabbitMQConfig;
import com.otoki.uptention.global.config.SolanaProperties;
import com.otoki.uptention.global.event.PaymentFailedEvent;
import com.otoki.uptention.global.event.PaymentSuccessEvent;
import com.otoki.uptention.global.exception.CustomException;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 주문 결제 처리 및 결제 이벤트를 관리하는 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SolanaPaymentVerifyServiceImpl implements SolanaPaymentVerifyService {

	private static final double AMOUNT_COMPARISON_TOLERANCE = 0.001;

	private final SolanaProperties solanaProperties;
	private final OrderService orderService;
	private final OrderItemService orderItemService;
	private final RabbitTemplate rabbitTemplate;

	@PostConstruct
	public void init() {
		log.info("주문 결제 서비스 초기화 중...");
	}

	/**
	 * 주문 처리 로직
	 */
	public void processOrder(String orderId, long blockTime, JsonNode result, String signature) {
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
				// 이미 완료된 상태면 오류로 처리하지 않고 정상 종료
				if (OrderStatus.PAYMENT_COMPLETED.equals(order.getStatus())) {
					log.info("주문 ID({})는 이미 결제 완료 상태입니다.", orderIdNum);
					return;
				}

				// 유효하지 않은 상태일 경우에만 실패 처리
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
			int orderTotalAmount = calculateTotalAmount(orderItems);

			// 5. 트랜잭션 금액 확인 (result가 있는 경우에만)
			double transactionAmount = orderTotalAmount; // 기본값으로 주문 금액 사용

			if (result != null && result.has("meta")) {
				transactionAmount = calculateTransactionAmount(result, orderIdNum);
			} else {
				log.info("주문 ID({})의 결제 금액: {} (기본값 사용)", orderIdNum, transactionAmount);
			}

			// 6. 금액 검증 (RPC 결과가 있는 경우에만)
			if (result != null && Math.abs(transactionAmount - orderTotalAmount) > AMOUNT_COMPARISON_TOLERANCE) {
				String reason = String.format(
					"금액이 일치하지 않음: 주문=%d, 트랜잭션=%.2f", orderTotalAmount, transactionAmount);
				log.warn("주문 ID({})의 금액이 일치하지 않습니다: 주문={}, 트랜잭션={}",
					orderIdNum, orderTotalAmount, transactionAmount);
				publishPaymentFailedEvent(orderId, reason, signature);
				return;
			}

			// 7. 모든 검증 통과 시 결제 완료 이벤트 발행
			publishPaymentSuccessEvent(orderIdNum, order.getUser().getId(), orderTotalAmount, signature);

		} catch (NumberFormatException e) {
			log.error("유효하지 않은 주문 ID 형식: {}", orderId, e);
			publishPaymentFailedEvent(orderId, "유효하지 않은 주문 ID 형식", signature);
		} catch (Exception e) {
			log.error("결제 처리 중 예상치 못한 오류: {}", orderId, e);
			publishPaymentFailedEvent(orderId, "결제 처리 중 시스템 오류: " + e.getMessage(), signature);
		}
	}

	/**
	 * 주문 항목의 총 금액을 계산합니다.
	 */
	private int calculateTotalAmount(List<OrderItem> orderItems) {
		int total = 0;
		for (OrderItem item : orderItems) {
			total += item.getTotalPrice();
		}
		return total;
	}

	/**
	 * 트랜잭션 데이터에서 금액을 계산합니다.
	 */
	private double calculateTransactionAmount(JsonNode result, Integer orderIdNum) {
		JsonNode meta = result.get("meta");
		if (!meta.has("preTokenBalances") || !meta.has("postTokenBalances")) {
			return 0.0;
		}

		JsonNode preBalances = meta.get("preTokenBalances");
		JsonNode postBalances = meta.get("postTokenBalances");

		for (int i = 0; i < preBalances.size(); i++) {
			JsonNode pre = preBalances.get(i);
			if (!pre.has("owner") || !pre.get("owner").asText().equals(solanaProperties.getCompanyWallet())) {
				continue;
			}

			// 같은 인덱스의 post 잔액 찾기
			for (int j = 0; j < postBalances.size(); j++) {
				JsonNode post = postBalances.get(j);
				if (post.get("accountIndex").asInt() == pre.get("accountIndex").asInt()) {
					// 워크 토큰인지 확인
					if (pre.has("mint") &&
						pre.get("mint").asText().equals(solanaProperties.getWorkTokenMint())) {

						double preAmount = Double.parseDouble(
							pre.path("uiTokenAmount").path("uiAmountString").asText("0"));
						double postAmount = Double.parseDouble(
							post.path("uiTokenAmount").path("uiAmountString").asText("0"));

						// 잔액 증가량 계산 (회사 지갑으로 전송된 금액)
						double amount = postAmount - preAmount;
						log.info("주문 ID({})의 결제 금액: {}", orderIdNum, amount);
						return amount;
					}
				}
			}
		}

		return 0.0;
	}

	/**
	 * 결제 성공 이벤트를 발행합니다.
	 */
	private void publishPaymentSuccessEvent(Integer orderIdNum, Integer userId, int totalAmount, String signature) {
		PaymentSuccessEvent event = PaymentSuccessEvent.builder()
			.orderId(orderIdNum)
			.userId(userId)
			.totalAmount(new BigDecimal(totalAmount))
			.completedAt(System.currentTimeMillis())
			.transactionSignature(signature)
			.build();

		rabbitTemplate.convertAndSend(RabbitMQConfig.PAYMENT_EXCHANGE,
			RabbitMQConfig.PAYMENT_COMPLETED_KEY, event);
		log.info("주문 ID({})의 결제 완료 이벤트를 발행했습니다.", orderIdNum);
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
			rabbitTemplate.convertAndSend(RabbitMQConfig.PAYMENT_EXCHANGE,
				RabbitMQConfig.PAYMENT_FAILED_KEY, event);
			log.info("결제 실패 이벤트 발행: 주문 ID={}, 사유={}", event.getOrderId(), event.getReason());
		} catch (Exception e) {
			log.error("결제 실패 이벤트 발행 중 오류", e);
		}
	}
}