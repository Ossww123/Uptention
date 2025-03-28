package com.otoki.uptention.domain.orderitem.service;

import java.util.List;

import com.otoki.uptention.domain.orderitem.entity.OrderItem;

public interface OrderItemService {

	OrderItem saveOrderItem(OrderItem orderItem);

	OrderItem getOrderItemById(Integer id);

	List<OrderItem> findOrderItemsByOrderIds(List<Integer> orderIds);
}
