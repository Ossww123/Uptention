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
import com.otoki.uptention.application.order.service.OrderAppService;
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

		// when
		when(userService.getUserById(anyInt())).thenReturn(user);
		when(itemService.getItemById(1)).thenReturn(item1);
		when(itemService.getItemById(2)).thenReturn(item2);
		when(itemService.getItemById(3)).thenReturn(item3);
		when(orderService.save(any(Order.class))).thenReturn(savedOrder);

		Order result = orderAppService.createOrder(orderRequestDto);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getId()).isEqualTo(1);
		assertThat(result.getAddress()).isEqualTo("서울시 강남구 테스트로 123");
		assertThat(result.getUser()).isEqualTo(user);

		verify(orderService, times(1)).save(any(Order.class));
		verify(orderItemService, times(3)).saveOrderItem(any(OrderItem.class));

		// 판매량 증가 확인
		assertThat(item1.getSalesCount()).isEqualTo(2);
		assertThat(item2.getSalesCount()).isEqualTo(1);
		assertThat(item3.getSalesCount()).isEqualTo(3);

		// 재고 수량 감소 확인
		assertThat(item1.getQuantity()).isEqualTo(8); // 상품1 재고 감소
		assertThat(item2.getQuantity()).isEqualTo(9); // 상품2 재고 감소
		assertThat(item3.getQuantity()).isEqualTo(7); // 상품3 재고 감소

		// OrderItem 생성 시 적절한 값 전달 확인 (세 번의 호출)
		verify(orderItemService, times(3)).saveOrderItem(any(OrderItem.class));
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

		// when
		when(userService.getUserById(2)).thenReturn(sender);
		when(userService.getUserById(3)).thenReturn(receiver);
		when(itemService.getItemById(3)).thenReturn(item);
		when(orderService.save(any(Order.class))).thenReturn(savedOrder);

		Order result = orderAppService.createGiftOrder(giftRequestDto);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getId()).isEqualTo(1);
		assertThat(result.getUser()).isEqualTo(sender);
		assertThat(result.getAddress()).isNull(); // 선물은 주소가 없음

		verify(orderService, times(1)).save(any(Order.class));
		verify(orderItemService, times(1)).saveOrderItem(any(OrderItem.class));
		verify(giftService, times(1)).save(any(Gift.class));

		// 판매량 증가 확인 (선물은 수량 1개)
		assertThat(item.getSalesCount()).isEqualTo(1);
		assertThat(item.getQuantity()).isEqualTo(9);

	}

	@Test
	@DisplayName("일반 주문 시 재고가 부족한 상품을 주문하려고 하면 예외가 발생한다.")
	void createOrder_ThrowsException_WhenStockIsInsufficient() {
		// given
		Integer itemId = 1;
		int orderQuantity = 10;

		// 재고가 5개인 상품을 Mock
		Item item = mock(Item.class);
		when(itemService.getItemById(itemId)).thenReturn(item);
		when(item.getQuantity()).thenReturn(5);  // 재고 5개 설정

		// 주문 요청 DTO 생성 (상품 1개를 10개 주문하려는 요청)
		OrderRequestDto orderRequestDto = OrderRequestDto.builder()
			.items(Arrays.asList(
				ItemQuantityRequestDto.builder().itemId(itemId).quantity(orderQuantity).build()
			))
			.address("테스트 주소")
			.build();

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
		Integer itemId = 1;
		int orderQuantity = 1;  // 선물 수량은 1개
		Item item = mock(Item.class);
		when(itemService.getItemById(itemId)).thenReturn(item);
		when(item.getQuantity()).thenReturn(0);  // 재고가 0개

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

	private OrderRequestDto createOrderRequestDto(String address, List<ItemQuantityRequestDto> items) {
		return OrderRequestDto.builder()
			.items(items)
			.address(address)
			.build();
	}

	private ItemQuantityRequestDto createItemQuantityRequestDto(Integer itemId, int quantity) {
		return ItemQuantityRequestDto.builder()
			.itemId(itemId)
			.quantity(quantity)
			.build();
	}

	private GiftRequestDto createGiftRequestDto(Integer itemId, Integer receiverId) {
		return GiftRequestDto.builder()
			.itemId(itemId)
			.receiverId(receiverId)
			.build();
	}
}