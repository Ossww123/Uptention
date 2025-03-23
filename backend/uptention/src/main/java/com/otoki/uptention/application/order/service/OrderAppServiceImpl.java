package com.otoki.uptention.application.order.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemServiceImpl;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.service.OrderServiceImpl;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemServiceImpl;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserServiceImpl;

import lombok.RequiredArgsConstructor;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class OrderAppServiceImpl implements OrderAppService{

	private final OrderServiceImpl orderService;
	private final OrderItemServiceImpl orderItemService;
	private final ItemServiceImpl itemService;
	private final UserServiceImpl userService;

	@Transactional
	@Override
	public Order createOrder(OrderRequestDto orderRequestDto) {
		// security 구현 후, 코드 수정 필요
		User user = userService.getUserById(2);

		// 1. Order 생성
		Order order = Order.builder()
			.user(user)
			.address(orderRequestDto.getAddress())
			.build();
		Order savedOrder = orderService.createOrderPurchase(order);

		// 2. OrderItem 생성 및 저장
		for (OrderRequestDto.OrderItemRequestDto itemRequest : orderRequestDto.getItems()) {
			Item item = itemService.getItemDetails(itemRequest.getItemId());

			OrderItem orderItem = OrderItem.builder()
				.order(order)
				.item(item)
				.quantity(itemRequest.getQuantity())
				.itemPrice(item.getPrice()) // 현재 가격으로 저장
				.build();

			orderItemService.createOrderItem(orderItem);

			// 판매량 증가
			item.increaseSalesCount(itemRequest.getQuantity());
		}
		return savedOrder;
	}
}
