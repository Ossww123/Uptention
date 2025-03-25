package com.otoki.uptention.application.order.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.order.dto.request.DeliveryInfoRequestDto;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
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

import lombok.RequiredArgsConstructor;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class OrderAppServiceImpl implements OrderAppService {

	private final OrderService orderService;
	private final OrderItemService orderItemService;
	private final ItemService itemService;
	private final UserService userService;
	private final GiftService giftService;

	/**
	 * 일반 주문 생성
	 */
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
		Order savedOrder = orderService.save(order);

		// 2. 각 상품에 대한 OrderItem 생성 및 저장
		for (ItemQuantityRequestDto itemRequest : orderRequestDto.getItems()) {
			processOrderItem(order, itemRequest.getItemId(), itemRequest.getQuantity());
		}

		return savedOrder;
	}

	/**
	 * 선물 주문 생성
	 */
	@Transactional
	@Override
	public Order createGiftOrder(GiftRequestDto giftRequestDto) {
		// security 구현 후, 코드 수정 필요
		User sender = userService.getUserById(2);
		User receiver = userService.getUserById(giftRequestDto.getReceiverId());

		// 1. Order 생성 - 선물의 경우 주소 X
		Order order = Order.builder()
			.user(sender) // 선물을 보내는 사람(구매자)
			.build();
		Order savedOrder = orderService.save(order);

		// 2. OrderItem 생성 및 저장 (선물은 기본적으로 수량 1개)
		processOrderItem(order, giftRequestDto.getItemId(), 1);

		// 3. Gift 엔티티 생성
		Gift gift = Gift.builder()
			.order(order)
			.receiver(receiver)
			.build();

		giftService.save(gift);

		return savedOrder;
	}

	/**
	 * 선물 받은 사용자의 배송지 정보 등록
	 */
	@Transactional
	@Override
	public Order registerDeliveryInfo(Integer orderId, DeliveryInfoRequestDto deliveryInfoRequestDto) {
		Order order = orderService.getOrderById(orderId);
		order.updateAddress(deliveryInfoRequestDto.getAddress());
		return orderService.save(order);
	}

	/**
	 * OrderItem을 생성하고 저장하는 공통 로직
	 */
	private OrderItem processOrderItem(Order order, Integer itemId, Integer quantity) {
		Item item = itemService.getItemDetails(itemId);

		// 재고 부족하면 예외 발생
		if (!item.hasStock(quantity)) {
			throw new CustomException(ErrorCode.ITEM_INSUFFICIENT_STOCK);
		}
		item.decreaseQuantity(quantity);

		OrderItem orderItem = OrderItem.builder()
			.order(order)
			.item(item)
			.quantity(quantity)
			.itemPrice(item.getPrice()) // 현재 가격으로 저장
			.build();

		orderItemService.createOrderItem(orderItem);

		// 판매량 증가
		item.increaseSalesCount(quantity);

		return orderItem;
	}

}