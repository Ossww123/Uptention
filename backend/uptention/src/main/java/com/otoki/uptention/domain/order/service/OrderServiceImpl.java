package com.otoki.uptention.domain.order.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.repository.OrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

	private final OrderRepository orderRepository;

	@Override
	public Order save(Order order) {
		return orderRepository.save(order);
	}
}
