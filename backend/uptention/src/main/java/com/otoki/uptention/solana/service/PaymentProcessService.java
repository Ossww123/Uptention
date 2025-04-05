package com.otoki.uptention.solana.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.inventory.service.InventoryService;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.global.exception.CustomException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 주문에 대한 트랜잭션 검증 이후, 결제 처리를 담당하는 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentProcessService {

	private final OrderService orderService;
	private final OrderItemService orderItemService;
	private final InventoryService inventoryService;

	/**
	 * 결제 완료 처리
	 *
	 * @param orderId 주문 ID
	 * @return 처리 결과 (성공/실패)
	 */
	@Transactional
	public boolean processPaymentSuccess(String orderId) {
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

			// 주문 항목 조회
			List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(order.getId());
			Map<Integer, Integer> itemQuantities = new HashMap<>();
			Map<Item, Integer> itemMap = new HashMap<>();

			// 각 상품과 수량 매핑
			for (OrderItem orderItem : orderItems) {
				Item item = orderItem.getItem();
				int quantity = orderItem.getQuantity();

				itemQuantities.put(item.getId(), quantity);
				itemMap.put(item, quantity);
			}

			// 일괄 재고 확정 처리
			boolean confirmed = inventoryService.confirmInventories(itemQuantities);
			if (!confirmed) {
				log.error("주문 ID({})의 일괄 재고 확정에 실패했습니다.", orderId);
				return false;
			}

			// 판매량 업데이트 (MySQL)
			for (Map.Entry<Item, Integer> entry : itemMap.entrySet()) {
				Item item = entry.getKey();
				Integer quantity = entry.getValue();
				item.increaseSalesCount(quantity);
				// 중요: 재고 차감은 Redis가 처리했으므로 MySQL에서 별도로 차감하지 않음
			}

			// 주문 상태 업데이트
			order.updateStatus(OrderStatus.PAYMENT_COMPLETED);

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

			// 주문 항목 조회
			List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(order.getId());
			Map<Integer, Integer> itemQuantities = new HashMap<>();

			// 각 상품과 수량 매핑
			for (OrderItem orderItem : orderItems) {
				Item item = orderItem.getItem();
				int quantity = orderItem.getQuantity();
				itemQuantities.put(item.getId(), quantity);
			}

			// 일괄 재고 예약 취소 처리
			boolean cancelled = inventoryService.cancelReservations(itemQuantities);
			if (!cancelled) {
				log.warn("주문 ID({})의 일부 상품 재고 예약 취소에 실패했습니다.", orderId);
				// 주문 취소 처리는 계속 진행
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
}