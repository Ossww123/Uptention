package com.otoki.uptention.order;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.otoki.uptention.AppServiceTestSupport;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.dto.response.InitiateOrderResponseDto;
import com.otoki.uptention.application.order.service.OrderAppService;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.item.entity.Item;
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

public class OrderAppServiceTest extends AppServiceTestSupport {

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

	@Test
	@DisplayName("구매 상품 리스트를 받아 주문을 생성한다.")
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

		// OrderItem 생성 시 반환값 설정
		when(orderItemService.saveOrderItem(argThat(oi -> oi.getItem().getId().equals(1)))).thenReturn(orderItem1);
		when(orderItemService.saveOrderItem(argThat(oi -> oi.getItem().getId().equals(2)))).thenReturn(orderItem2);
		when(orderItemService.saveOrderItem(argThat(oi -> oi.getItem().getId().equals(3)))).thenReturn(orderItem3);

		InitiateOrderResponseDto result = orderAppService.createOrder(orderRequestDto);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getOrderId()).isEqualTo(1);
		assertThat(result.getPaymentAmount()).isEqualTo(expectedTotalAmount);

		verify(orderService, times(1)).saveOrder(any(Order.class));
		verify(orderItemService, times(3)).saveOrderItem(any(OrderItem.class));

		// 판매량 증가 확인
		assertThat(item1.getSalesCount()).isEqualTo(2);
		assertThat(item2.getSalesCount()).isEqualTo(1);
		assertThat(item3.getSalesCount()).isEqualTo(3);

		// 재고 수량 감소 확인
		assertThat(item1.getQuantity()).isEqualTo(8); // 상품1 재고 감소
		assertThat(item2.getQuantity()).isEqualTo(9); // 상품2 재고 감소
		assertThat(item3.getQuantity()).isEqualTo(7); // 상품3 재고 감소
	}

	@Test
	@DisplayName("선물 주문을 생성한다.")
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

		InitiateOrderResponseDto result = orderAppService.createGiftOrder(giftRequestDto);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getOrderId()).isEqualTo(1);
		assertThat(result.getPaymentAmount()).isEqualTo(15000); // 선물 상품 1개 가격

		verify(orderService, times(1)).saveOrder(any(Order.class));
		verify(orderItemService, times(1)).saveOrderItem(any(OrderItem.class));
		verify(giftService, times(1)).saveGift(any(Gift.class));

		// 판매량 증가 확인 (선물은 수량 1개)
		assertThat(item.getSalesCount()).isEqualTo(1);
		assertThat(item.getQuantity()).isEqualTo(9);
	}

	@Test
	@DisplayName("일반 주문 시 재고가 부족한 상품을 주문하려고 하면 예외가 발생한다.")
	void createOrder_ThrowsException_WhenStockIsInsufficient() {
		// given
		User user = createUser(1);
		Integer itemId = 1;
		int orderQuantity = 10;

		// 재고가 5개인 상품을 Mock
		Item item = createItem(itemId, "재고 부족 상품", 10000, 5);
		when(securityService.getLoggedInUser()).thenReturn(user);
		when(itemService.getItemById(itemId)).thenReturn(item);

		// 주문 요청 DTO 생성 (상품 1개를 10개 주문하려는 요청)
		OrderRequestDto orderRequestDto = new OrderRequestDto(
			Arrays.asList(createItemQuantityRequestDto(itemId, orderQuantity)),
			"테스트 주소"
		);

		// when & then
		assertThatThrownBy(() -> orderAppService.createOrder(orderRequestDto))
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_INSUFFICIENT_STOCK);
			});
	}

	@Test
	@DisplayName("선물 주문 시 재고가 부족하면 예외가 발생한다.")
	void createGiftOrder_ThrowsException_WhenStockIsInsufficient() {
		// given
		User sender = createUser(2);
		Integer itemId = 1;
		Item item = createItem(itemId, "재고 부족 선물", 10000, 0);  // 재고가 0개

		when(securityService.getLoggedInUser()).thenReturn(sender);
		when(itemService.getItemById(itemId)).thenReturn(item);

		GiftRequestDto giftRequestDto = createGiftRequestDto(itemId, 3);  // 선물 받는 사람 ID: 3

		// when & then
		assertThatThrownBy(() -> orderAppService.createGiftOrder(giftRequestDto))
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_INSUFFICIENT_STOCK);
			});
	}

	// 헬퍼 메서드
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