package com.otoki.uptention.application.order.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.order.dto.request.DeliveryInfoRequestDto;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.dto.response.OrderHistoryCursorResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderItemResponseDto;
import com.otoki.uptention.domain.common.CursorDto;
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
		User user = userService.getUserById(1);

		// 1. Order 생성
		Order order = Order.builder()
			.user(user)
			.address(orderRequestDto.getAddress())
			.build();
		Order savedOrder = orderService.saveOrder(order);

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
		User sender = userService.getUserById(1);
		User receiver = userService.getUserById(giftRequestDto.getReceiverId());

		// 1. Order 생성 - 선물의 경우 주소 X
		Order order = Order.builder()
			.user(sender) // 선물을 보내는 사람(구매자)
			.build();
		Order savedOrder = orderService.saveOrder(order);

		// 2. OrderItem 생성 및 저장 (선물은 기본적으로 수량 1개)
		processOrderItem(order, giftRequestDto.getItemId(), 1);

		// 3. Gift 엔티티 생성
		Gift gift = Gift.builder()
			.order(order)
			.receiver(receiver)
			.build();

		giftService.saveGift(gift);

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
		return orderService.saveOrder(order);
	}

	/**
	 * OrderItem을 생성하고 저장하는 공통 로직
	 */
	private OrderItem processOrderItem(Order order, Integer itemId, Integer quantity) {
		Item item = itemService.getItemById(itemId);

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

		orderItemService.saveOrderItem(orderItem);

		// 판매량 증가
		item.increaseSalesCount(quantity);

		return orderItem;
	}

	/**
	 * 주문 내역 조회
	 */
	@Override
	@Transactional(readOnly = true)
	public OrderHistoryCursorResponseDto getOrderHistory(String cursorStr, int size, String type) {
		// 주문 유형 검증
		validateOrderType(type);

		// 현재 사용자 조회 (임시로 ID 2 사용)
		User user = userService.getUserById(2);

		// 커서 처리 및 주문 목록 조회
		List<Order> orders = fetchOrdersByType(user.getId(), cursorStr, size + 1, type);

		// 페이지네이션 처리 및 응답 생성
		return createOrderHistoryResponse(orders, size);
	}

	/**
	 * 주문 유형 검증
	 */
	private void validateOrderType(String type) {
		if (!"PURCHASE".equals(type) && !"GIFT".equals(type)) {
			throw new CustomException(ErrorCode.ORDER_INVALID_TYPE);
		}
	}

	/**
	 * 유형에 따른 주문 목록 조회
	 */
	private List<Order> fetchOrdersByType(Integer userId, String cursorStr, int limit, String type) {
		CursorDto cursor = CursorDto.decode(cursorStr);
		boolean isPurchase = "PURCHASE".equals(type);

		if (cursor == null) {
			// 첫 페이지 조회
			return isPurchase
				? orderService.findPurchaseOrdersByUserIdWithLimit(userId, limit)
				: orderService.findGiftOrdersByUserIdWithLimit(userId, limit);
		} else {
			// 다음 페이지 조회
			return isPurchase
				? orderService.findPurchaseOrdersByUserIdAndCursor(userId, cursor.getId(), limit)
				: orderService.findGiftOrdersByUserIdAndCursor(userId, cursor.getId(), limit);
		}
	}

	/**
	 * 주문 내역 응답 생성
	 */
	private OrderHistoryCursorResponseDto createOrderHistoryResponse(List<Order> orders, int size) {
		// 다음 페이지 여부 확인
		boolean hasNextPage = orders.size() > size;

		// 요청한 size만큼만 사용
		List<Order> resultOrders = hasNextPage ? orders.subList(0, size) : orders;

		if (resultOrders.isEmpty()) {
			return OrderHistoryCursorResponseDto.builder()
				.orderItems(List.of())
				.hasNextPage(false)
				.nextCursor(null)
				.build();
		}

		// 주문 항목 조회 및 변환
		List<OrderItemResponseDto> orderItemDtos = getOrderItemResponseDtos(resultOrders);

		// 다음 커서 생성
		String nextCursor = createNextCursor(hasNextPage, resultOrders);

		return OrderHistoryCursorResponseDto.builder()
			.orderItems(orderItemDtos)
			.hasNextPage(hasNextPage)
			.nextCursor(nextCursor)
			.build();
	}

	/**
	 * 주문 항목 DTO 변환
	 */
	private List<OrderItemResponseDto> getOrderItemResponseDtos(List<Order> resultOrders) {
		// 주문 ID 목록 추출
		List<Integer> orderIds = resultOrders.stream()
			.map(Order::getId)
			.collect(Collectors.toList());

		// 각 주문의 모든 항목 조회 (N+1 문제 방지를 위해 IN 쿼리 사용)
		List<OrderItem> orderItems = orderItemService.findOrderItemsByOrderIds(orderIds);

		// OrderItemResponseDto로 변환
		return orderItems.stream()
			.map(item -> {
				Order order = item.getOrder();
				return OrderItemResponseDto.builder()
					.orderItemId(item.getId())
					.orderId(order.getId())
					.itemName(item.getItem().getName())
					.quantity(item.getQuantity())
					.itemPrice(item.getItemPrice())
					.totalPrice(item.getItemPrice() * item.getQuantity())
					.status(order.getStatus().getDescription())
					.orderDate(order.getCreatedAt())
					.build();
			})
			.collect(Collectors.toList());
	}

	/**
	 * 다음 커서 생성
	 */
	private String createNextCursor(boolean hasNextPage, List<Order> resultOrders) {
		if (hasNextPage && !resultOrders.isEmpty()) {
			Order lastOrder = resultOrders.get(resultOrders.size() - 1);
			CursorDto nextCursorDto = new CursorDto(0, lastOrder.getId());
			return nextCursorDto.encode();
		}
		return null;
	}

}