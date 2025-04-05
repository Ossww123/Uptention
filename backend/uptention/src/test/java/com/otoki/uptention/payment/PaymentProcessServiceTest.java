package com.otoki.uptention.payment;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.otoki.uptention.domain.inventory.service.InventoryService;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.solana.service.PaymentProcessService;

@ExtendWith(MockitoExtension.class)
public class PaymentProcessServiceTest {

	@Mock
	private OrderService orderService;

	@Mock
	private OrderItemService orderItemService;

	@Mock
	private InventoryService inventoryService;

	@InjectMocks
	private PaymentProcessService paymentProcessService;

	@Test
	@DisplayName("결제 완료 처리가 성공적으로 수행된다")
	void processPaymentSuccess_Success() {
		// given
		String orderId = "1";
		Order order = Order.builder()
			.id(1)
			.status(OrderStatus.PAYMENT_PENDING)
			.build();

		// Item을 mock으로 생성
		Item item1 = mock(Item.class);
		when(item1.getId()).thenReturn(1);

		Item item2 = mock(Item.class);
		when(item2.getId()).thenReturn(2);

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

		// Redis 재고 확정을 bulk 방식으로 성공하도록 설정
		when(inventoryService.confirmInventories(argThat(map ->
			map.size() == 2 &&
				map.get(1) == 2 &&
				map.get(2) == 3
		))).thenReturn(true);

		// when
		boolean result = paymentProcessService.processPaymentSuccess(orderId);

		// then
		assertThat(result).isTrue();
		assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_COMPLETED);

		verify(orderService, times(1)).getOrderById(1);
		verify(orderItemService, times(1)).findOrderItemsByOrderId(1);

		// bulk 재고 확정 호출 검증
		verify(inventoryService, times(1)).confirmInventories(argThat(map ->
			map.size() == 2 &&
				map.get(1) == 2 &&
				map.get(2) == 3
		));

		// 판매량 업데이트 호출 검증
		verify(item1, times(1)).increaseSalesCount(2);
		verify(item2, times(1)).increaseSalesCount(3);

		// MySQL 재고 차감은 호출되지 않음
		verify(item1, never()).decreaseQuantity(anyInt());
		verify(item2, never()).decreaseQuantity(anyInt());
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
		verify(inventoryService, never()).confirmInventory(anyInt(), anyInt());
	}

	@Test
	@DisplayName("Redis 재고 확정 실패 시 결제 완료 처리도 실패한다")
	void processPaymentSuccess_ConfirmationFailed() {
		// given
		String orderId = "1";
		Order order = Order.builder()
			.id(1)
			.status(OrderStatus.PAYMENT_PENDING)
			.build();

		// Item을 mock으로 생성
		Item item1 = mock(Item.class);
		when(item1.getId()).thenReturn(1);

		Item item2 = mock(Item.class);
		when(item2.getId()).thenReturn(2);

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
		when(inventoryService.confirmInventories(argThat(map ->
			map.size() == 2 &&
				map.get(1) == 2 &&
				map.get(2) == 3
		))).thenReturn(false);

		// when
		boolean result = paymentProcessService.processPaymentSuccess(orderId);

		// then
		assertThat(result).isFalse();
		assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);

		verify(orderService, times(1)).getOrderById(1);
		verify(orderItemService, times(1)).findOrderItemsByOrderId(1);
		verify(inventoryService, times(1)).confirmInventories(argThat(map ->
			map.size() == 2 &&
				map.get(1) == 2 &&
				map.get(2) == 3
		));

		// 첫 번째 아이템은 확정 성공했을 경우 increaseSalesCount가 호출되어야 하는지,
		// 실패 시에는 호출되지 않도록 로직에 따라 검증 (여기서는 모두 실패하므로 increaseSalesCount가 호출되지 않아야 함)
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
			.build();

		// Item을 mock으로 생성
		Item item1 = mock(Item.class);
		when(item1.getId()).thenReturn(1);

		Item item2 = mock(Item.class);
		when(item2.getId()).thenReturn(2);

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
		when(inventoryService.cancelReservations(argThat(map ->
			map.size() == 2 &&
				map.get(1) == 2 &&
				map.get(2) == 3
		))).thenReturn(true);

		// when
		boolean result = paymentProcessService.processPaymentFailure(orderId, reason);

		// then
		assertThat(result).isTrue();
		assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_FAILED);

		verify(orderService, times(1)).getOrderById(1);
		verify(orderItemService, times(1)).findOrderItemsByOrderId(1);
		verify(inventoryService, times(1)).cancelReservations(argThat(map ->
			map.size() == 2 &&
				map.get(1) == 2 &&
				map.get(2) == 3
		));

		// 판매량 감소는 호출되지 않음
		verify(item1, never()).decreaseSalesCount(anyInt());
		verify(item2, never()).decreaseSalesCount(anyInt());
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
		verify(inventoryService, never()).cancelReservation(anyInt(), anyInt());
	}
}