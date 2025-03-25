package com.otoki.uptention.domain.order.service;

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
}
