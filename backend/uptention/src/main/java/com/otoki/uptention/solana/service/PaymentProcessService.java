package com.otoki.uptention.solana.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.solana.event.PaymentCompletedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 처리를 담당하는 서비스
 * 트랜잭션 모니터링 서비스와 주문 서비스 사이의 중간 계층
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentProcessService {

	private final OrderService orderService;
	private final OrderItemService orderItemService;
	private final ItemService itemService;
	private final RabbitTemplate rabbitTemplate;

	/**
	 * 결제 완료 처리
	 *
	 * @param orderId 주문 ID
	 * @param transactionSignature 솔라나 트랜잭션 서명
	 * @return 처리 결과 (성공/실패)
	 */
	@Transactional
	public boolean processPaymentSuccess(String orderId, String transactionSignature) {
		try {
			log.info("주문 ID({})에 대한 결제 완료 처리 시작", orderId);

			// 주문 ID로 주문 조회
			Integer orderIdNum = Integer.parseInt(orderId);
			Order order = orderService.getOrderById(orderIdNum);

			// 이미 결제 완료된 주문인지 확인
			if (OrderStatus.PAYMENT_COMPLETED.equals(order.getStatus())) {
				log.info("주문 ID({})는 이미 결제 완료되었습니다.", orderId);
				return true;
			}

			// 주문 상태 업데이트
			order.updateStatus(OrderStatus.PAYMENT_COMPLETED);
			orderService.saveOrder(order);

			// 결제 완료 이벤트 발행
			publishPaymentCompletedEvent(order, transactionSignature);

			log.info("주문 ID({})에 대한 결제 완료 처리 완료", orderId);
			return true;
		} catch (NumberFormatException e) {
			log.error("유효하지 않은 주문 ID 형식: {}", orderId, e);
			return false;
		} catch (CustomException e) {
			log.error("주문 처리 중 비즈니스 오류 발생: {} - {}", orderId, e.getMessage(), e);
			return false;
		} catch (Exception e) {
			log.error("주문 처리 중 예상치 못한 오류 발생: {}", orderId, e);
			return false;
		}
	}

	/**
	 * 결제 실패 처리
	 *
	 * @param orderId 주문 ID
	 * @param reason  실패 사유
	 * @return 처리 결과 (성공/실패)
	 */
	@Transactional
	public boolean processPaymentFailure(String orderId, String reason) {
		try {
			log.info("주문 ID({})에 대한 결제 실패 처리 시작: {}", orderId, reason);

			// 주문 ID로 주문 조회
			Integer orderIdNum = Integer.parseInt(orderId);
			Order order = orderService.getOrderById(orderIdNum);

			// 이미 처리된 주문인지 확인
			if (!OrderStatus.PAYMENT_PENDING.equals(order.getStatus())) {
				log.info("주문 ID({})는 이미 처리되었습니다. 현재 상태: {}", orderId, order.getStatus());
				return true;
			}

			// 주문 상태 업데이트
			order.updateStatus(OrderStatus.PAYMENT_FAILED);
			orderService.saveOrder(order);

			// 주문 항목 조회
			List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(order.getId());

			// 각 항목의 재고 및 판매량 복구
			for (OrderItem orderItem : orderItems) {
				Item item = orderItem.getItem();
				int quantity = orderItem.getQuantity();

				// 재고 복구
				item.increaseQuantity(quantity);
				// 판매량 감소
				item.decreaseSalesCount(quantity);

				log.info("상품(ID={})의 재고 및 판매량 복구: 수량={}", item.getId(), quantity);
			}

			log.info("주문 ID({})에 대한 결제 실패 처리 완료", orderId);
			return true;
		} catch (NumberFormatException e) {
			log.error("유효하지 않은 주문 ID 형식: {}", orderId, e);
			return false;
		} catch (CustomException e) {
			log.error("결제 실패 처리 중 비즈니스 오류 발생: {} - {}", orderId, e.getMessage(), e);
			return false;
		} catch (Exception e) {
			log.error("결제 실패 처리 중 예상치 못한 오류 발생: {}", orderId, e);
			return false;
		}
	}

	/**
	 * 결제 완료 이벤트 발행
	 */
	private void publishPaymentCompletedEvent(Order order, String transactionSignature) {
		try {
			// 주문의 총 금액 계산
			List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(order.getId());
			int totalAmount = orderItems.stream()
				.mapToInt(OrderItem::getTotalPrice)
				.sum();

			// 이벤트 생성
			PaymentCompletedEvent event = PaymentCompletedEvent.builder()
				.orderId(order.getId())
				.userId(order.getUser().getId())
				.totalAmount(new BigDecimal(totalAmount))
				.completedAt(System.currentTimeMillis())
				.transactionSignature(transactionSignature)
				.build();

			// RabbitMQ를 통해 이벤트 발행
			rabbitTemplate.convertAndSend("payment.exchange", "payment.completed", event);
			log.info("결제 완료 이벤트 발행: 주문 ID={}, 사용자 ID={}, 금액={}, 트랜잭션={}",
				event.getOrderId(), event.getUserId(), event.getTotalAmount(), event.getTransactionSignature());
		} catch (Exception e) {
			log.error("결제 완료 이벤트 발행 중 오류 발생: {}", order.getId(), e);
			// 이벤트 발행 실패가 주문 상태 업데이트를 롤백시키지 않도록 예외 처리
		}
	}

	/**
	 * 결제 대기 주문 타임아웃 확인 (스케줄러)
	 */
	@Scheduled(fixedRate = 300000) // 5분마다 실행
	public void checkPendingPayments() {
		log.info("결제 대기 주문 타임아웃 확인 시작");

		// 결제 대기 상태인 주문 조회
		List<Order> pendingOrders = orderService.getOrdersByStatus(OrderStatus.PAYMENT_PENDING);

		for (Order order : pendingOrders) {
			// LocalDateTime을 Instant로 변환하고 경과 시간 계산
			long orderAgeMinutes = Duration.between(
				order.getCreatedAt(),
				LocalDateTime.now()
			).toMinutes();

			if (orderAgeMinutes >= 30) {
				log.info("주문 ID({})의 결제 시간 초과 (경과 시간: {}분)", order.getId(), orderAgeMinutes);

				// 결제 실패 처리 - 트랜잭션 문제 해결을 위해 서비스를 주입받아 사용
				String orderId = String.valueOf(order.getId());
				boolean success = processPaymentFailure(orderId, "결제 시간 초과 (30분)");

				if (success) {
					log.info("주문 ID({})의 결제 실패 처리가 완료되었습니다.", orderId);
				} else {
					log.error("주문 ID({})의 결제 실패 처리에 실패했습니다.", orderId);
				}
			}
		}

		log.info("결제 대기 주문 타임아웃 확인 완료");
	}
}