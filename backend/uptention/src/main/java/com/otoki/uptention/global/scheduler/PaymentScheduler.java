package com.otoki.uptention.global.scheduler;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.otoki.uptention.application.payment.service.PaymentProcessService;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.global.lock.DistributedLockManager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentScheduler {

	private static final int PAYMENT_TIMEOUT_MINUTES = 2; // 2분 타임아웃
	private static final String PAYMENT_CHECK_LOCK = "scheduler:payment:check";

	private final OrderService orderService;
	private final PaymentProcessService paymentProcessService;
	private final DistributedLockManager lockManager;

	/**
	 * 결제 대기 주문 타임아웃 확인 (스케줄러)
	 */
	@Scheduled(fixedRate = 60000) // 1분마다 실행
	public void checkPendingPayments() {
		lockManager.executeWithLock(PAYMENT_CHECK_LOCK, 10, 50, () -> {

			log.info("결제 대기 주문 타임아웃 확인 시작");

			// 결제 대기 상태인 주문 조회
			List<Order> pendingOrders = orderService.getOrdersByStatus(OrderStatus.PAYMENT_PENDING);

			for (Order order : pendingOrders) {
				// LocalDateTime을 Instant로 변환하고 경과 시간 계산
				long orderAgeMinutes = Duration.between(
					order.getCreatedAt(),
					LocalDateTime.now()
				).toMinutes();

				// 2분 (설정된 타임아웃) 초과 시 처리
				if (orderAgeMinutes >= PAYMENT_TIMEOUT_MINUTES) {
					log.info("주문 ID({})의 결제 시간 초과 (경과 시간: {}분)", order.getId(), orderAgeMinutes);
					// 결제 실패 처리
					String orderId = String.valueOf(order.getId());
					boolean success = paymentProcessService.processPaymentFailure(orderId,
						"결제 시간 초과 (" + PAYMENT_TIMEOUT_MINUTES + "분)");

					if (success) {
						log.info("주문 ID({})의 결제 실패 처리가 완료되었습니다.", orderId);
					} else {
						log.error("주문 ID({})의 결제 실패 처리에 실패했습니다.", orderId);
					}
				}
			}

			log.info("결제 대기 주문 타임아웃 확인 완료");
		});
	}
}
