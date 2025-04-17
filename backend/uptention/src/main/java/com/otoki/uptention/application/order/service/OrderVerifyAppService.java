package com.otoki.uptention.application.order.service;

import java.util.List;

import com.otoki.uptention.application.order.dto.request.ItemVerificationDto;
import com.otoki.uptention.application.order.dto.response.ItemVerificationResponseDto;

public interface OrderVerifyAppService {
	List<ItemVerificationResponseDto> verifyOrderItem(List<ItemVerificationDto> itemVerificationDtos);

}
