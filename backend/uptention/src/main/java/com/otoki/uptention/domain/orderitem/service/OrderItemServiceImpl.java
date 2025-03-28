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
	public OrderItem getOrderItemById(Integer id) {
		return orderItemRepository.findById(id)
			.orElseThrow(() -> new CustomException(ErrorCode.ORDER_ITEM_NOT_FOUND));
	}

	@Override
	public List<OrderItem> findOrderItemsByOrderIds(List<Integer> orderIds) {
		return orderItemRepository.findAllByOrderIdInWithItemJoin(orderIds);
	}
}
