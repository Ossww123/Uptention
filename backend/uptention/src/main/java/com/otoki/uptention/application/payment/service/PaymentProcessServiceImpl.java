package com.otoki.uptention.application.payment.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.InventoryService;
import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.notification.service.NotificationService;
import com.otoki.uptention.domain.order.entity.Gift;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.GiftService;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.infra.fcm.service.FcmSendService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 주문에 대한 트랜잭션 검증 이후, 결제 처리를 담당하는 서비스 구현체
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentProcessServiceImpl implements PaymentProcessService {

	// 알림 메시지 관련 상수
	private static final String PAYMENT_SUCCESS_TITLE = "💳 결제 완료 ✨";
	private static final String PAYMENT_FAILURE_TITLE = "⚠️ 결제 실패 ⚠️";
	private static final String PAYMENT_SUCCESS_STATUS = "결제가 완료되었습니다.";
	private static final String PAYMENT_FAILURE_STATUS = "결제가 실패하였습니다.";
	private static final String PAYMENT_REASON_PREFIX = " 사유: ";

	// 선물 알림 관련 상수
	private static final String GIFT_NOTIFICATION_TITLE = "🎁선물이 도착했어요!🎁";
	private static final String GIFT_NOTIFICATION_SUFFIX = "님이 %s을(를) 선물로 보냈어요!";

	private final OrderService orderService;
	private final OrderItemService orderItemService;
	private final InventoryService inventoryService;
	private final GiftService giftService;
	private final FcmSendService fcmSendService;
	private final NotificationService notificationService;

	/**
	 * 결제 완료 처리
	 *
	 * @param orderId 주문 ID
	 * @return 처리 결과 (성공/실패)
	 */
	@Override
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

			// 주문 상태 검증
			if (!OrderStatus.PAYMENT_PENDING.equals(order.getStatus())) {
				log.warn("주문 ID({})의 상태가 결제 대기 상태가 아닙니다. 현재 상태: {}", orderId, order.getStatus());
				return false;
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

			// 선물인 경우 알림 처리
			processGiftNotificationIfNeeded(order);

			// 결제 완료 알림 처리
			sendPaymentNotification(order, true, null);

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
	@Override
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

			// 결제 실패 알림 처리
			sendPaymentNotification(order, false, reason);

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
			.collect(HashMap::new,
				(map, orderItem) -> map.put(orderItem.getItem().getId(), orderItem.getQuantity()),
				HashMap::putAll);
	}

	/**
	 * 판매량 업데이트
	 */
	private void updateSalesCount(Map<Item, Integer> itemMap) {
		for (Map.Entry<Item, Integer> entry : itemMap.entrySet()) {
			Item item = entry.getKey();
			Integer quantity = entry.getValue();
			item.increaseSalesCount(quantity);
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

	/**
	 * 선물인 경우 알림 처리
	 */
	private void processGiftNotificationIfNeeded(Order order) {
		try {
			// 선물인지 확인
			Gift gift = giftService.findGiftByOrderId(order.getId());

			if (gift != null) {
				User sender = order.getUser();
				User receiver = gift.getReceiver();

				log.info("주문 ID({})는 선물입니다. 수신자({})에게 알림을 보냅니다.", order.getId(), receiver.getId());

				// 선물 상품명 조회 (선물은 단일 상품만 가능)
				OrderItem giftItem = orderItemService.findGiftItemByOrderId(order.getId());
				String itemName = giftItem.getItem().getName();

				// FCM 알림 전송
				String body = String.format(sender.getName() + GIFT_NOTIFICATION_SUFFIX, itemName);

				sendNotificationToUser(receiver, GIFT_NOTIFICATION_TITLE, body);

				log.info("선물 알림이 성공적으로 전송되었습니다. 주문 ID: {}, 수신자: {}", order.getId(), receiver.getId());
			}
		} catch (Exception e) {
			// 알림 전송 실패가 결제 처리 성공에 영향을 주지 않도록 예외 처리
			log.error("선물 알림 처리 중 오류 발생: 주문 ID: {}, 오류: {}", order.getId(), e.getMessage(), e);
		}
	}

	/**
	 * 결제 알림 처리 (성공/실패 공통)
	 */
	private void sendPaymentNotification(Order order, boolean isSuccess, String reason) {
		try {
			User user = order.getUser();
			List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderId(order.getId());

			if (orderItems.isEmpty()) {
				log.warn("주문 ID({})에 대한 주문 항목이 없습니다.", order.getId());
				return;
			}

			// 첫 번째 상품 이름 가져오기
			String firstItemName = orderItems.get(0).getItem().getName();

			// 알림 메시지 구성
			String title = isSuccess ? PAYMENT_SUCCESS_TITLE : PAYMENT_FAILURE_TITLE;
			String status = isSuccess ? PAYMENT_SUCCESS_STATUS : PAYMENT_FAILURE_STATUS;
			String body;

			if (orderItems.size() > 1) {
				body = firstItemName + " 외 " + (orderItems.size() - 1) + "건 " + status;
			} else {
				body = firstItemName + " " + status;
			}

			// 실패 이유가 있는 경우 추가
			if (!isSuccess && reason != null && !reason.trim().isEmpty()) {
				body += PAYMENT_REASON_PREFIX + reason;
			}

			// 알림 전송
			sendNotificationToUser(user, title, body);

			log.info("결제 {} 알림이 성공적으로 전송되었습니다. 주문 ID: {}, 사용자: {}",
				isSuccess ? "완료" : "실패", order.getId(), user.getId());
		} catch (Exception e) {
			// 알림 전송 실패가 결제 처리 성공에 영향을 주지 않도록 예외 처리
			log.error("결제 알림 처리 중 오류 발생: 주문 ID: {}, 오류: {}", order.getId(), e.getMessage(), e);
		}
	}

	/**
	 * 사용자에게 알림 전송 및 저장
	 */
	private void sendNotificationToUser(User user, String title, String body) {
		// FCM 알림 전송
		fcmSendService.sendNotificationToUser(user, title, body);

		// 알림 내역 저장
		Notification notification = Notification.builder()
			.user(user)
			.title(title)
			.message(body)
			.read(false)
			.build();

		notificationService.saveNotification(notification);
	}
}
