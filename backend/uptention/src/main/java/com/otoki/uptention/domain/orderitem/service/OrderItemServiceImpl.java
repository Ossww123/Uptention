package com.otoki.uptention.domain.orderitem.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.orderitem.entity.OrderItem;
import com.otoki.uptention.domain.orderitem.repository.OrderItemRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService{

	private final OrderItemRepository orderItemRepository;

	@Override
	public OrderItem saveOrderItem(OrderItem orderItem) {
		return orderItemRepository.save(orderItem);
	}
}
