package com.otoki.uptention.solana.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

			// 주문 ID로 주문 조회 및 상태 검증
			Order order = getAndValidateOrder(orderId);

			// 이미 결제 완료된 주문인지 확인
			if (OrderStatus.PAYMENT_COMPLETED.equals(order.getStatus())) {
				log.info("주문 ID({})는 이미 결제 완료되었습니다.", orderId);
				return true;
			}

			// 주문 항목 조회 및 매핑
			Map<Integer, Integer> itemQuantities = new HashMap<>();
			Map<Item, Integer> itemMap = new HashMap<>();
			collectOrderItems(order.getId(), itemQuantities, itemMap);

			// 재고 처리
			if (!inventoryService.confirmInventories(itemQuantities)) {
				log.error("주문 ID({})의 일괄 재고 확정에 실패했습니다.", orderId);
				return false;
			}

			// 판매량 업데이트
			updateSalesCount(itemMap);

			// 주문 상태 업데이트
			order.updateStatus(OrderStatus.PAYMENT_COMPLETED);

			log.info("주문 ID({})에 대한 결제 완료 처리 완료", orderId);
			return true;
		} catch (Exception e) {
			return handlePaymentProcessException(orderId, e, "결제 완료");
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

			// 주문 ID로 주문 조회 및 상태 검증
			Order order = getAndValidateOrder(orderId);

			// 이미 처리된 주문인지 확인
			if (!OrderStatus.PAYMENT_PENDING.equals(order.getStatus())) {
				log.info("주문 ID({})는 이미 처리되었습니다. 현재 상태: {}", orderId, order.getStatus());
				return true;
			}

			// 주문 상태 업데이트
			order.updateStatus(OrderStatus.PAYMENT_FAILED);

			// 주문 항목 조회 및 재고 예약 취소
			Map<Integer, Integer> itemQuantities = collectOrderItemsForCancel(order.getId());

			// 재고 예약 취소
			if (!inventoryService.cancelReservations(itemQuantities)) {
				log.warn("주문 ID({})의 일부 상품 재고 예약 취소에 실패했습니다.", orderId);
				// 주문 취소 처리는 계속 진행
			}

			log.info("주문 ID({})에 대한 결제 실패 처리 완료", orderId);
			return true;
		} catch (Exception e) {
			return handlePaymentProcessException(orderId, e, "결제 실패");
		}
	}

	/**
	 * 주문 ID로 주문을 조회하고 유효성을 검증
	 */
	private Order getAndValidateOrder(String orderId) {
		try {
			Integer orderIdNum = Integer.parseInt(orderId);
			return orderService.getOrderById(orderIdNum);
		} catch (NumberFormatException e) {
			log.error("유효하지 않은 주문 ID 형식: {}", orderId);
			throw e;
		}
	}

	/**
	 * 주문 항목 조회 및 매핑
	 */
	private void collectOrderItems(Integer orderId, Map<Integer, Integer> itemQuantities, Map<Item, Integer> itemMap) {
		List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(orderId);

		for (OrderItem orderItem : orderItems) {
			Item item = orderItem.getItem();
			int quantity = orderItem.getQuantity();

			itemQuantities.put(item.getId(), quantity);
			itemMap.put(item, quantity);
		}
	}

	/**
	 * 주문 항목 조회 (취소용)
	 */
	private Map<Integer, Integer> collectOrderItemsForCancel(Integer orderId) {
		List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(orderId);

		return orderItems.stream()
			.collect(Collectors.toMap(
				orderItem -> orderItem.getItem().getId(),
				OrderItem::getQuantity
			));
	}

	/**
	 * 판매량 업데이트
	 */
	private void updateSalesCount(Map<Item, Integer> itemMap) {
		for (Map.Entry<Item, Integer> entry : itemMap.entrySet()) {
			Item item = entry.getKey();
			Integer quantity = entry.getValue();
			item.increaseSalesCount(quantity);
			// 중요: 재고 차감은 Redis가 처리했으므로 MySQL에서 별도로 차감하지 않음
		}
	}

	/**
	 * 예외 처리 공통 메서드
	 */
	private boolean handlePaymentProcessException(String orderId, Exception e, String processType) {
		if (e instanceof NumberFormatException) {
			log.error("유효하지 않은 주문 ID 형식: {}", orderId, e);
		} else if (e instanceof CustomException) {
			log.error("{} 처리 중 비즈니스 오류 발생: {} - {}", processType, orderId, e.getMessage(), e);
		} else {
			log.error("{} 처리 중 예상치 못한 오류 발생: {}", processType, orderId, e);
		}
		return false;
	}
}