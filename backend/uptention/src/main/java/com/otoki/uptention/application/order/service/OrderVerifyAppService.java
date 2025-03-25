package com.otoki.uptention.application.order.service;

import com.otoki.uptention.application.order.dto.request.OrderVerificationRequestDto;
import com.otoki.uptention.application.order.dto.response.OrderVerificationResponseDto;

public interface OrderVerifyAppService {
	OrderVerificationResponseDto verifyOrderItem(OrderVerificationRequestDto orderVerificationRequestDto);

}
