package com.otoki.uptention.application.order.service;

import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.domain.order.entity.Order;

public interface OrderAppService {

	Order createOrder(OrderRequestDto orderRequestDto);
}
