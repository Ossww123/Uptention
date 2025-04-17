package com.otoki.uptention.payment;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.otoki.uptention.application.payment.service.PaymentProcessServiceImpl;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.InventoryService;
import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.notification.service.NotificationService;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.GiftService;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.infra.fcm.service.FcmSendService;

@ExtendWith(MockitoExtension.class)
public class PaymentProcessServiceTest {

	@Mock
	private OrderService orderService;

	@Mock
	private OrderItemService orderItemService;

	@Mock
	private InventoryService inventoryService;

	@Mock
	private GiftService giftService;

	@Mock
	private FcmSendService fcmSendService;

	@Mock
	private NotificationService notificationService;

	@InjectMocks
	private PaymentProcessServiceImpl paymentProcessService;

	@Test
	@DisplayName("결제 완료 처리가 성공적으로 수행된다")
	void processPaymentSuccess_Success() {
		// given
		String orderId = "1";
		Order order = Order.builder()
			.id(1)
			.status(OrderStatus.PAYMENT_PENDING)
			.user(mock(User.class))
			.build();

		// Item을 mock으로 생성 - lenient 설정 추가
		Item item1 = mock(Item.class);
		lenient().when(item1.getId()).thenReturn(1);
		lenient().when(item1.getName()).thenReturn("테스트 상품 1");

		Item item2 = mock(Item.class);
		lenient().when(item2.getId()).thenReturn(2);
		lenient().when(item2.getName()).thenReturn("테스트 상품 2");

		OrderItem orderItem1 = OrderItem.builder()
			.id(1)
			.order(order)
			.item(item1)
			.quantity(2)
			.build();

		OrderItem orderItem2 = OrderItem.builder()
			.id(2)
			.order(order)
			.item(item2)
			.quantity(3)
			.build();

		List<OrderItem> orderItems = Arrays.asList(orderItem1, orderItem2);

		when(orderService.getOrderById(1)).thenReturn(order);
		when(orderItemService.findOrderItemsByOrderId(1)).thenReturn(orderItems);
		when(giftService.findGiftByOrderId(anyInt())).thenReturn(null);

		// Redis 재고 확정을 bulk 방식으로 성공하도록 설정
		when(inventoryService.confirmInventories(any())).thenReturn(true);

		// when
		boolean result = paymentProcessService.processPaymentSuccess(orderId);

		// then
		assertThat(result).isTrue();
		assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_COMPLETED);

		verify(orderService, times(1)).getOrderById(1);
		verify(orderItemService, times(2)).findOrderItemsByOrderId(1);

		// bulk 재고 확정 호출 검증
		ArgumentCaptor<Map<Integer, Integer>> mapCaptor = ArgumentCaptor.forClass(Map.class);
		verify(inventoryService, times(1)).confirmInventories(mapCaptor.capture());

		Map<Integer, Integer> capturedMap = mapCaptor.getValue();
		assertThat(capturedMap).hasSize(2);
		assertThat(capturedMap.get(1)).isEqualTo(2);
		assertThat(capturedMap.get(2)).isEqualTo(3);

		// 판매량 업데이트 호출 검증
		verify(item1, times(1)).increaseSalesCount(2);
		verify(item2, times(1)).increaseSalesCount(3);

		// 알림 관련 서비스 호출 검증
		verify(fcmSendService, times(1)).sendNotificationToUser(any(User.class), anyString(), anyString());
		verify(notificationService, times(1)).saveNotification(any(Notification.class));
	}

	@Test
	@DisplayName("이미 결제 완료된 주문은 처리를 건너뛴다")
	void processPaymentSuccess_AlreadyCompleted() {
		// given
		String orderId = "1";
		Order order = Order.builder()
			.id(1)
			.status(OrderStatus.PAYMENT_COMPLETED) // 이미 결제 완료 상태
			.build();

		when(orderService.getOrderById(1)).thenReturn(order);

		// when
		boolean result = paymentProcessService.processPaymentSuccess(orderId);

		// then
		assertThat(result).isTrue();

		verify(orderService, times(1)).getOrderById(1);
		verify(orderItemService, never()).findOrderItemsByOrderId(anyInt());
		verify(inventoryService, never()).confirmInventories(anyMap());
	}

	@Test
	@DisplayName("Redis 재고 확정 실패 시 결제 완료 처리도 실패한다")
	void processPaymentSuccess_ConfirmationFailed() {
		// given
		String orderId = "1";
		Order order = Order.builder()
			.id(1)
			.status(OrderStatus.PAYMENT_PENDING)
			.user(mock(User.class))
			.build();

		// Item을 mock으로 생성
		Item item1 = mock(Item.class);
		lenient().when(item1.getId()).thenReturn(1);
		lenient().when(item1.getName()).thenReturn("테스트 상품 1");

		Item item2 = mock(Item.class);
		lenient().when(item2.getId()).thenReturn(2);
		lenient().when(item2.getName()).thenReturn("테스트 상품 2");

		OrderItem orderItem1 = OrderItem.builder()
			.id(1)
			.order(order)
			.item(item1)
			.quantity(2)
			.build();

		OrderItem orderItem2 = OrderItem.builder()
			.id(2)
			.order(order)
			.item(item2)
			.quantity(3)
			.build();

		List<OrderItem> orderItems = Arrays.asList(orderItem1, orderItem2);

		when(orderService.getOrderById(1)).thenReturn(order);
		when(orderItemService.findOrderItemsByOrderId(1)).thenReturn(orderItems);

		// bulk 재고 확정 실패 설정
		when(inventoryService.confirmInventories(any())).thenReturn(false);

		// when
		boolean result = paymentProcessService.processPaymentSuccess(orderId);

		// then
		assertThat(result).isFalse();
		assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);

		verify(orderService, times(1)).getOrderById(1);
		verify(orderItemService, times(1)).findOrderItemsByOrderId(1);

		// bulk 재고 확정 호출 검증
		ArgumentCaptor<Map<Integer, Integer>> mapCaptor = ArgumentCaptor.forClass(Map.class);
		verify(inventoryService, times(1)).confirmInventories(mapCaptor.capture());

		Map<Integer, Integer> capturedMap = mapCaptor.getValue();
		assertThat(capturedMap).hasSize(2);
		assertThat(capturedMap.get(1)).isEqualTo(2);
		assertThat(capturedMap.get(2)).isEqualTo(3);

		// 실패했으므로 판매량 증가가 호출되지 않아야 함
		verify(item1, never()).increaseSalesCount(anyInt());
		verify(item2, never()).increaseSalesCount(anyInt());
	}

	@Test
	@DisplayName("결제 실패 처리가 성공적으로 수행된다")
	void processPaymentFailure_Success() {
		// given
		String orderId = "1";
		String reason = "테스트 실패 사유";

		Order order = Order.builder()
			.id(1)
			.status(OrderStatus.PAYMENT_PENDING)
			.user(mock(User.class))
			.build();

		// Item을 mock으로 생성
		Item item1 = mock(Item.class);
		lenient().when(item1.getId()).thenReturn(1);
		lenient().when(item1.getName()).thenReturn("테스트 상품 1");

		Item item2 = mock(Item.class);
		lenient().when(item2.getId()).thenReturn(2);
		lenient().when(item2.getName()).thenReturn("테스트 상품 2");

		OrderItem orderItem1 = OrderItem.builder()
			.id(1)
			.order(order)
			.item(item1)
			.quantity(2)
			.build();

		OrderItem orderItem2 = OrderItem.builder()
			.id(2)
			.order(order)
			.item(item2)
			.quantity(3)
			.build();

		List<OrderItem> orderItems = Arrays.asList(orderItem1, orderItem2);

		when(orderService.getOrderById(1)).thenReturn(order);
		when(orderItemService.findOrderItemsByOrderId(1)).thenReturn(orderItems);

		// bulk 재고 예약 취소 성공 설정
		when(inventoryService.cancelReservations(any())).thenReturn(true);

		// when
		boolean result = paymentProcessService.processPaymentFailure(orderId, reason);

		// then
		assertThat(result).isTrue();
		assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_FAILED);

		verify(orderService, times(1)).getOrderById(1);
		verify(orderItemService, times(2)).findOrderItemsByOrderId(1);

		// bulk 재고 예약 취소 호출 검증
		ArgumentCaptor<Map<Integer, Integer>> mapCaptor = ArgumentCaptor.forClass(Map.class);
		verify(inventoryService, times(1)).cancelReservations(mapCaptor.capture());

		Map<Integer, Integer> capturedMap = mapCaptor.getValue();
		assertThat(capturedMap).hasSize(2);
		assertThat(capturedMap.get(1)).isEqualTo(2);
		assertThat(capturedMap.get(2)).isEqualTo(3);

		// 판매량 감소는 호출되지 않음
		verify(item1, never()).decreaseSalesCount(anyInt());
		verify(item2, never()).decreaseSalesCount(anyInt());

		// 알림 관련 서비스 호출 검증
		verify(fcmSendService, times(1)).sendNotificationToUser(any(User.class), anyString(), anyString());
		verify(notificationService, times(1)).saveNotification(any(Notification.class));
	}

	@Test
	@DisplayName("이미 처리된 주문은 결제 실패 처리를 건너뛴다")
	void processPaymentFailure_AlreadyProcessed() {
		// given
		String orderId = "1";
		String reason = "테스트 실패 사유";

		Order order = Order.builder()
			.id(1)
			.status(OrderStatus.PAYMENT_FAILED) // 이미 실패 상태
			.build();

		when(orderService.getOrderById(1)).thenReturn(order);

		// when
		boolean result = paymentProcessService.processPaymentFailure(orderId, reason);

		// then
		assertThat(result).isTrue();

		verify(orderService, times(1)).getOrderById(1);
		verify(orderItemService, never()).findOrderItemsByOrderId(anyInt());
		verify(inventoryService, never()).cancelReservations(anyMap());
	}
}