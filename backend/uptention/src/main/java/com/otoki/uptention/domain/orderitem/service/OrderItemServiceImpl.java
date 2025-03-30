package com.otoki.uptention.domain.orderitem.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.repository.OrderItemRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

	private final OrderItemRepository orderItemRepository;

	@Override
	public OrderItem saveOrderItem(OrderItem orderItem) {
		return orderItemRepository.save(orderItem);
	}

	@Override
	public List<OrderItem> findOrderItemsByOrderId(Integer orderId) {
		return orderItemRepository.findByOrderId(orderId);
	}

	@Override
	public List<OrderItem> findOrderItemsByOrderIds(List<Integer> orderIds) {
		return orderItemRepository.findAllByOrderIdInWithItemJoin(orderIds);
	}

	@Override
	public OrderItem findByIdAndOrderId(Integer orderItemId, Integer orderId) {
		return orderItemRepository.findByIdAndOrderId(orderItemId, orderId)
			.orElseThrow(() -> new CustomException(ErrorCode.ORDER_ITEM_NOT_FOUND));
	}
}
