package com.otoki.uptention.domain.order.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.repository.OrderRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

	private final OrderRepository orderRepository;

	@Override
	public Order saveOrder(Order order) {
		return orderRepository.save(order);
	}

	@Override
	public Order getOrderById(Integer id) {
		return orderRepository.findById(id)
			.orElseThrow(() -> new CustomException(ErrorCode.ORDER_NOT_FOUND));
	}

	public String getLatestDeliveryAddress(Integer userId) {
		return orderRepository.findLatestDeliveryAddressByUserId(userId);
	}

	// 구매 주문 조회 (첫 페이지)
	@Override
	public List<Order> findPurchaseOrdersByUserIdWithLimit(Integer userId, int limit) {
		return orderRepository.findPurchaseOrdersByUserIdWithLimit(userId, limit);
	}

	// 구매 주문 조회 (다음 페이지 - 커서 기반)
	@Override
	public List<Order> findPurchaseOrdersByUserIdAndCursor(Integer userId, Integer orderId, int limit) {
		return orderRepository.findPurchaseOrdersByUserIdAndCursor(userId, orderId, limit);
	}

	// 사용자가 선물한 주문 조회 (첫 페이지)
	@Override
	public List<Order> findGiftOrdersByUserIdWithLimit(Integer userId, int limit) {
		return orderRepository.findGiftOrdersByUserIdWithLimit(userId, limit);
	}

	// 사용자가 선물한 주문 조회 (다음 페이지 - 커서 기반)
	@Override
	public List<Order> findGiftOrdersByUserIdAndCursor(Integer userId, Integer orderId, int limit) {
		return orderRepository.findGiftOrdersByUserIdAndCursor(userId, orderId, limit);
	}
}
