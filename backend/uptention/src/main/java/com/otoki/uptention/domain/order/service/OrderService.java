package com.otoki.uptention.domain.order.service;

import com.otoki.uptention.domain.order.entity.Order;

public interface OrderService {
	Order save(Order order);
	Order getOrderById(Integer id);
}
