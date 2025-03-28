package com.otoki.uptention.domain.order.service;

import java.util.List;

import com.otoki.uptention.domain.order.entity.Order;

public interface OrderService {
	Order saveOrder(Order order);
	Order getOrderById(Integer id);
	List<Order> findPurchaseOrdersByUserIdWithLimit(Integer userId, int limit);
	List<Order> findPurchaseOrdersByUserIdAndCursor(Integer userId, Integer orderId, int limit);
	List<Order> findGiftOrdersByUserIdWithLimit(Integer userId, int limit);
	List<Order> findGiftOrdersByUserIdAndCursor(Integer userId, Integer orderId, int limit);
}
