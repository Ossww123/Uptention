package com.otoki.uptention.order;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.otoki.uptention.AppServiceTestSupport;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.service.OrderAppService;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;

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

	@Test
	@DisplayName("사용자가 상품을 주문하면 주문과 각 주문상품이 생성되고 각 상품의 판매량이 각각 증가한다")
	void createOrder_WithMultipleItems_CreatesOrderAndIncreasesEachItemSalesCount() {
		// given
		User user = createUser(1);
		Item item1 = createItem(1, "테스트 상품 1", 10000);
		Item item2 = createItem(2, "테스트 상품 2", 20000);
		Item item3 = createItem(3, "테스트 상품 3", 30000);

		OrderRequestDto orderRequestDto = createOrderRequestDto(
			"서울시 강남구 테스트로 123",
			List.of(
				createOrderItemRequestDto(1, 2),
				createOrderItemRequestDto(2, 1),
				createOrderItemRequestDto(3, 3)
			)
		);

		Order savedOrder = createOrder(1, user, "서울시 강남구 테스트로 123");

		// when
		when(userService.getUserById(anyInt())).thenReturn(user);
		when(itemService.getItemDetails(1)).thenReturn(item1);
		when(itemService.getItemDetails(2)).thenReturn(item2);
		when(itemService.getItemDetails(3)).thenReturn(item3);
		when(orderService.createOrderPurchase(any(Order.class))).thenReturn(savedOrder);

		Order result = orderAppService.createOrder(orderRequestDto);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getId()).isEqualTo(1);
		assertThat(result.getAddress()).isEqualTo("서울시 강남구 테스트로 123");
		assertThat(result.getUser()).isEqualTo(user);

		verify(orderService, times(1)).createOrderPurchase(any(Order.class));
		verify(orderItemService, times(3)).createOrderItem(any(OrderItem.class));

		// 판매량 증가 확인
		assertThat(item1.getSalesCount()).isEqualTo(2);
		assertThat(item2.getSalesCount()).isEqualTo(1);
		assertThat(item3.getSalesCount()).isEqualTo(3);

		// OrderItem 생성 시 적절한 값 전달 확인 (세 번의 호출)
		verify(orderItemService, times(3)).createOrderItem(any(OrderItem.class));
	}

	// 헬퍼 메서드
	private User createUser(Integer id) {
		return User.builder()
			.id(id)
			.name("테스트 사용자")
			.build();
	}

	private Item createItem(Integer id, String name, int price) {
		return Item.builder()
			.id(id)
			.name(name)
			.price(price)
			.salesCount(0)
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

	private OrderRequestDto createOrderRequestDto(String address, List<OrderRequestDto.OrderItemRequestDto> items) {
		return OrderRequestDto.builder()
			.items(items)
			.address(address)
			.build();
	}

	private OrderRequestDto.OrderItemRequestDto createOrderItemRequestDto(Integer itemId, int quantity) {
		return OrderRequestDto.OrderItemRequestDto.builder()
			.itemId(itemId)
			.quantity(quantity)
			.build();
	}
}