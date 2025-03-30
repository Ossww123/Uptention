package com.otoki.uptention.application.order.service;

import com.otoki.uptention.application.order.dto.request.DeliveryInfoRequestDto;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.dto.response.InitiateOrderResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderDetailResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderHistoryCursorResponseDto;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderHistoryType;

public interface OrderAppService {
	InitiateOrderResponseDto createOrder(OrderRequestDto orderRequestDto);

	InitiateOrderResponseDto createGiftOrder(GiftRequestDto giftRequestDto);

	Order registerDeliveryInfo(Integer orderId, DeliveryInfoRequestDto deliveryInfoRequestDto);

	OrderHistoryCursorResponseDto getOrderHistory(String cursor, int size, OrderHistoryType type);

	OrderDetailResponseDto getOrderDetail(Integer orderId, Integer orderItemId);
}
