package com.otoki.uptention.domain.orderitem.service;

import java.util.List;

import com.otoki.uptention.domain.orderitem.entity.OrderItem;

public interface OrderItemService {

	OrderItem saveOrderItem(OrderItem orderItem);

	List<OrderItem> findOrderItemsByOrderId(Integer orderId);

	List<OrderItem> findOrderItemsByOrderIds(List<Integer> orderIds);

	OrderItem findByIdAndOrderId(Integer orderItemId, Integer orderId);
}
