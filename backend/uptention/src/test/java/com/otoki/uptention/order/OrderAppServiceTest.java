package com.otoki.uptention.order;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.otoki.uptention.ServiceTestSupport;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.dto.response.InitiateOrderResponseDto;
import com.otoki.uptention.application.order.service.OrderAppService;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.InventoryService;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.domain.order.entity.Gift;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.service.GiftService;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

public class OrderAppServiceTest extends ServiceTestSupport {

	@Autowired
	private OrderAppService orderAppService;

	@MockBean
	private OrderService orderService;

	@MockBean
	private OrderItemService orderItemService;

	@MockBean
	private ItemService itemService;

	@MockBean
	private UserService userService;

	@MockBean
	private GiftService giftService;

	@MockBean
	private SecurityService securityService;

	@MockBean
	private InventoryService inventoryService;

	@Test
	@DisplayName("구매 상품 리스트를 받아 주문을 생성한다 (Redis 재고 예약 포함)")
	void createOrder() {
		// given
		User user = createUser(1);
		Item item1 = createItem(1, "테스트 상품 1", 10000, 10);
		Item item2 = createItem(2, "테스트 상품 2", 20000, 10);
		Item item3 = createItem(3, "테스트 상품 3", 30000, 10);

		OrderRequestDto orderRequestDto = createOrderRequestDto(
			"서울시 강남구 테스트로 123",
			List.of(
				createItemQuantityRequestDto(1, 2),
				createItemQuantityRequestDto(2, 1),
				createItemQuantityRequestDto(3, 3)
			)
		);

		Order savedOrder = createOrder(1, user, "서울시 강남구 테스트로 123");

		// Mock OrderItem 객체 생성
		OrderItem orderItem1 = createOrderItem(1, savedOrder, item1, 2, item1.getPrice());
		OrderItem orderItem2 = createOrderItem(2, savedOrder, item2, 1, item2.getPrice());
		OrderItem orderItem3 = createOrderItem(3, savedOrder, item3, 3, item3.getPrice());

		// 총 결제 금액 계산 (10000 * 2 + 20000 * 1 + 30000 * 3 = 130000)
		int expectedTotalAmount = (10000 * 2) + (20000 * 1) + (30000 * 3);

		// when
		when(securityService.getLoggedInUser()).thenReturn(user);
		when(itemService.getItemById(1)).thenReturn(item1);
		when(itemService.getItemById(2)).thenReturn(item2);
		when(itemService.getItemById(3)).thenReturn(item3);
		when(orderService.saveOrder(any(Order.class))).thenReturn(savedOrder);

		// 변경: 개별 재고 예약 대신 일괄 재고 예약 모킹
		Map<Integer, Integer> expectedItemQuantities = new HashMap<>();
		expectedItemQuantities.put(1, 2);
		expectedItemQuantities.put(2, 1);
		expectedItemQuantities.put(3, 3);
		when(inventoryService.reserveInventories(argThat(map ->
			map.size() == 3
				&& map.get(1) == 2
				&& map.get(2) == 1
				&& map.get(3) == 3
		))).thenReturn(true);

		// OrderItem 생성 시 반환값 설정
		when(orderItemService.saveOrderItem(any(OrderItem.class)))
			.thenReturn(orderItem1)
			.thenReturn(orderItem2)
			.thenReturn(orderItem3);

		InitiateOrderResponseDto result = orderAppService.createOrder(orderRequestDto);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getOrderId()).isEqualTo(1);
		assertThat(result.getPaymentAmount()).isEqualTo(expectedTotalAmount);

		// 변경: 일괄 재고 예약 호출 확인
		verify(inventoryService, times(1)).reserveInventories(argThat(map ->
			map.size() == 3
				&& map.get(1) == 2
				&& map.get(2) == 1
				&& map.get(3) == 3
		));

		verify(orderService, times(1)).saveOrder(any(Order.class));
		verify(orderItemService, times(3)).saveOrderItem(any(OrderItem.class));
	}

	@Test
	@DisplayName("선물 주문을 생성한다 (Redis 재고 예약 포함)")
	void createGiftOrder() {
		// given
		User sender = createUser(2);
		User receiver = createUser(3);
		Item item = createItem(3, "선물 상품", 15000, 10);

		GiftRequestDto giftRequestDto = createGiftRequestDto(3, 3);

		Order savedOrder = createOrder(1, sender, null); // 선물은 주소가 필요 없음

		// Mock OrderItem 객체 생성
		OrderItem orderItem = createOrderItem(1, savedOrder, item, 1, item.getPrice());

		// when
		when(securityService.getLoggedInUser()).thenReturn(sender);
		when(userService.getUserById(3)).thenReturn(receiver);
		when(itemService.getItemById(3)).thenReturn(item);
		when(orderService.saveOrder(any(Order.class))).thenReturn(savedOrder);
		when(orderItemService.saveOrderItem(any(OrderItem.class))).thenReturn(orderItem);

		// 변경: 일괄 재고 예약 모킹
		when(inventoryService.reserveInventories(argThat(map ->
			map.size() == 1 && map.get(3) == 1
		))).thenReturn(true);

		InitiateOrderResponseDto result = orderAppService.createGiftOrder(giftRequestDto);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getOrderId()).isEqualTo(1);
		assertThat(result.getPaymentAmount()).isEqualTo(15000); // 선물 상품 1개 가격

		// 변경: 일괄 재고 예약 호출 확인
		verify(inventoryService, times(1)).reserveInventories(argThat(map ->
			map.size() == 1 && map.get(3) == 1
		));

		verify(orderService, times(1)).saveOrder(any(Order.class));
		verify(orderItemService, times(1)).saveOrderItem(any(OrderItem.class));
		verify(giftService, times(1)).saveGift(any(Gift.class));
	}

	@Test
	@DisplayName("Redis 재고 예약에 실패하면 주문 생성에 실패한다")
	void createOrder_ThrowsException_WhenReservationFails() {
		// given
		User user = createUser(1);
		Item item1 = createItem(1, "테스트 상품 1", 10000, 10);
		Item item2 = createItem(2, "테스트 상품 2", 20000, 10);

		OrderRequestDto orderRequestDto = createOrderRequestDto(
			"서울시 강남구 테스트로 123",
			List.of(
				createItemQuantityRequestDto(1, 2),
				createItemQuantityRequestDto(2, 1)
			)
		);

		when(securityService.getLoggedInUser()).thenReturn(user);

		// 변경: 일괄 재고 예약 실패 설정
		when(inventoryService.reserveInventories(any())).thenReturn(false);

		// 변경: 일괄 재고 취소 성공 설정
		when(inventoryService.cancelReservations(any())).thenReturn(true);

		// when & then
		assertThatThrownBy(() -> orderAppService.createOrder(orderRequestDto))
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_INSUFFICIENT_STOCK);
			});

		// 예약 취소는 호출되지 않음 (예약 자체가 실패했으므로)
		verify(inventoryService, never()).cancelReservations(any());
	}

	@Test
	@DisplayName("선물 주문 시 Redis 재고 예약에 실패하면 주문 생성에 실패한다")
	void createGiftOrder_ThrowsException_WhenReservationFails() {
		// given
		Integer itemId = 1;
		User sender = createUser(2);
		User receiver = createUser(3);
		Item item = createItem(itemId, "재고 부족 선물", 10000, 0);

		// when
		when(securityService.getLoggedInUser()).thenReturn(sender);
		when(userService.getUserById(3)).thenReturn(receiver);
		when(itemService.getItemById(itemId)).thenReturn(item);

		// 변경: 일괄 재고 예약 실패 설정
		when(inventoryService.reserveInventories(any())).thenReturn(false);

		GiftRequestDto giftRequestDto = createGiftRequestDto(itemId, 3);

		// when & then
		assertThatThrownBy(() -> orderAppService.createGiftOrder(giftRequestDto))
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_INSUFFICIENT_STOCK);
			});
	}

	// 헬퍼 메서드 (변경 없음)
	private User createUser(Integer id) {
		return User.builder()
			.id(id)
			.name("테스트 사용자" + id)
			.build();
	}

	private Item createItem(Integer id, String name, int price, int quantity) {
		return Item.builder()
			.id(id)
			.name(name)
			.price(price)
			.salesCount(0)
			.quantity(quantity)
			.status(true)
			.build();
	}

	private Order createOrder(Integer id, User user, String address) {
		return Order.builder()
			.id(id)
			.user(user)
			.address(address)
			.build();
	}

	private OrderItem createOrderItem(Integer id, Order order, Item item, int quantity, int itemPrice) {
		return OrderItem.builder()
			.id(id)
			.order(order)
			.item(item)
			.quantity(quantity)
			.itemPrice(itemPrice)
			.build();
	}

	private OrderRequestDto createOrderRequestDto(String address, List<ItemQuantityRequestDto> items) {
		return new OrderRequestDto(items, address);
	}

	private ItemQuantityRequestDto createItemQuantityRequestDto(Integer itemId, int quantity) {
		return new ItemQuantityRequestDto(itemId, quantity);
	}

	private GiftRequestDto createGiftRequestDto(Integer itemId, Integer receiverId) {
		return new GiftRequestDto(itemId, receiverId);
	}
}