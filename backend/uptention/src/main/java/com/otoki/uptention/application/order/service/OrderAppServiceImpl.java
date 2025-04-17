package com.otoki.uptention.application.order.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.order.dto.request.DeliveryInfoRequestDto;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemQuantityRequestDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.dto.response.DeliveryAddressResponseDto;
import com.otoki.uptention.application.order.dto.response.InitiateOrderResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderDetailResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderHistoryCursorResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderItemResponseDto;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.InventoryService;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.domain.order.entity.Gift;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.GiftStatus;
import com.otoki.uptention.domain.order.enums.OrderHistoryType;
import com.otoki.uptention.domain.order.service.GiftService;
import com.otoki.uptention.domain.order.service.OrderService;
import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.service.OrderItemService;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderAppServiceImpl implements OrderAppService {

	private final OrderService orderService;
	private final OrderItemService orderItemService;
	private final ItemService itemService;
	private final UserService userService;
	private final GiftService giftService;
	private final SecurityService securityService;
	private final InventoryService inventoryService;

	/**
	 * 일반 주문 생성
	 */
	@Transactional
	@Override
	public InitiateOrderResponseDto createOrder(OrderRequestDto orderRequestDto) {
		User user = securityService.getLoggedInUser();

		// 1. 모든 상품에 대한 재고 예약 정보 구성
		Map<Integer, Integer> itemQuantities = new HashMap<>();
		for (ItemQuantityRequestDto itemRequest : orderRequestDto.getItems()) {
			itemQuantities.put(itemRequest.getItemId(), itemRequest.getQuantity());
		}

		// 2. 한 번에 모든 상품의 재고 예약 (MultiLock 사용)
		boolean reserved = inventoryService.reserveInventories(itemQuantities);
		if (!reserved) {
			throw new CustomException(ErrorCode.ITEM_INSUFFICIENT_STOCK);
		}

		try {
			// 3. Order 생성
			Order order = Order.builder()
				.user(user)
				.address(orderRequestDto.getAddress())
				.build();
			Order savedOrder = orderService.saveOrder(order);

			// 4. 각 상품에 대한 OrderItem 생성 및 저장
			int totalPaymentAmount = 0;
			for (ItemQuantityRequestDto itemRequest : orderRequestDto.getItems()) {
				OrderItem orderItem = processOrderItem(order, itemRequest.getItemId(), itemRequest.getQuantity());
				totalPaymentAmount += orderItem.getTotalPrice();
			}

			return InitiateOrderResponseDto.builder()
				.orderId(savedOrder.getId())
				.paymentAmount(totalPaymentAmount)
				.build();
		} catch (Exception e) {
			// 예약이 성공한 후 주문 생성 과정에서 에러가 발생하면 예약 롤백
			inventoryService.cancelReservations(itemQuantities);
			throw e;
		}
	}

	/**
	 * 선물 주문 생성
	 */
	@Transactional
	@Override
	public InitiateOrderResponseDto createGiftOrder(GiftRequestDto giftRequestDto) {
		User sender = securityService.getLoggedInUser();
		User receiver = userService.getUserById(giftRequestDto.getReceiverId());

		// 단일 상품이지만 일관성을 위해 배치 메서드 사용
		Map<Integer, Integer> itemQuantity = new HashMap<>();
		itemQuantity.put(giftRequestDto.getItemId(), 1);

		// 재고 예약 시도
		boolean reserved = inventoryService.reserveInventories(itemQuantity);
		if (!reserved) {
			throw new CustomException(ErrorCode.ITEM_INSUFFICIENT_STOCK);
		}

		try {
			// 1. Order 생성 - 선물의 경우 주소 X
			Order order = Order.builder()
				.user(sender) // 선물을 보내는 사람(구매자)
				.build();
			Order savedOrder = orderService.saveOrder(order);

			// 2. OrderItem 생성 및 저장 (선물은 기본적으로 수량 1개)
			OrderItem orderItem = processOrderItem(order, giftRequestDto.getItemId(), 1);
			int totalPaymentAmount = orderItem.getTotalPrice();

			// 3. Gift 엔티티 생성
			Gift gift = Gift.builder()
				.order(order)
				.receiver(receiver)
				.build();

			giftService.saveGift(gift);

			return InitiateOrderResponseDto.builder()
				.orderId(savedOrder.getId())
				.paymentAmount(totalPaymentAmount)
				.build();
		} catch (Exception e) {
			// 예외 발생 시 재고 예약 롤백 (MultiLock 사용)
			inventoryService.cancelReservations(itemQuantity);
			throw e;
		}
	}

	/**
	 * 선물 받은 사용자의 배송지 정보 등록
	 */
	@Transactional
	@Override
	public Order registerDeliveryInfo(Integer orderId, DeliveryInfoRequestDto deliveryInfoRequestDto) {
		Order order = orderService.getOrderById(orderId);
		order.updateAddress(deliveryInfoRequestDto.getAddress());

		// Gift 엔티티의 상태를 수령 완료로 업데이트
		Gift gift = order.getGift();
		if (gift != null) {
			gift.updateStatus(GiftStatus.RECEIVED);
		}

		return order;
	}

	@Override
	public DeliveryAddressResponseDto getLatestDeliveryAddress() {
		Integer userId = securityService.getLoggedInUser().getId();
		String latestAddress = orderService.getLatestDeliveryAddress(userId);
		return DeliveryAddressResponseDto.builder()
			.address(latestAddress != null ? latestAddress : "")
			.build();
	}

	/**
	 * OrderItem을 생성하고 저장하는 공통 로직 + 재고 감소
	 * 참고: Redis 재고 예약은 이미 이루어진 상태
	 */
	private OrderItem processOrderItem(Order order, Integer itemId, Integer quantity) {
		Item item = itemService.getItemById(itemId);

		OrderItem orderItem = OrderItem.builder()
			.order(order)
			.item(item)
			.quantity(quantity)
			.itemPrice(item.getPrice()) // 현재 가격으로 저장
			.build();

		orderItemService.saveOrderItem(orderItem);

		return orderItem;
	}

	/**
	 * 주문 내역 조회
	 */
	@Override
	public OrderHistoryCursorResponseDto getOrderHistory(String cursorStr, int size, OrderHistoryType type) {

		User user = securityService.getLoggedInUser();

		// 커서 처리 및 주문 목록 조회
		List<Order> orders = fetchOrdersByType(user.getId(), cursorStr, size + 1, type);

		// 페이지네이션 처리 및 응답 생성
		return createOrderHistoryResponse(orders, size);
	}

	/**
	 * 주문 상세 내역 조회
	 */
	@Override
	public OrderDetailResponseDto getOrderDetail(Integer orderId, Integer orderItemId) {
		OrderItem orderItem = orderItemService.findByIdAndOrderId(orderItemId, orderId);

		// 선물 여부 확인
		Gift gift = giftService.findGiftByOrderId(orderId);

		// 공통 빌더 생성
		OrderDetailResponseDto.OrderDetailResponseDtoBuilder builder = createOrderDetailBuilder(orderItem);

		if (gift != null) {
			// 선물인 경우
			User receiver = gift.getReceiver();
			return builder
				.receiverName(receiver.getName())
				.build();
		}

		// 일반 구매인 경우
		return builder
			.quantity(orderItem.getQuantity())
			.address(orderItem.getOrder().getAddress())
			.build();
	}

	private OrderDetailResponseDto.OrderDetailResponseDtoBuilder createOrderDetailBuilder(OrderItem orderItem) {
		Order order = orderItem.getOrder();
		Item item = orderItem.getItem();

		return OrderDetailResponseDto.builder()
			.orderItemId(orderItem.getId())
			.orderId(order.getId())
			.itemName(item.getName())
			.brand(item.getBrand())
			.totalPrice(orderItem.getTotalPrice())
			.status(order.getStatus().getDescription())
			.orderDate(order.getCreatedAt());
	}

	/**
	 * 유형에 따른 주문 목록 조회
	 */
	private List<Order> fetchOrdersByType(Integer userId, String cursorStr, int limit, OrderHistoryType type) {
		CursorDto<Integer> cursor = CursorDto.decode(cursorStr, Integer.class);
		boolean isPurchase = OrderHistoryType.PURCHASE.equals(type);

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
			CursorDto<Integer> nextCursorDto = new CursorDto<>(0, lastOrder.getId());
			return nextCursorDto.encode();
		}
		return null;
	}

}
