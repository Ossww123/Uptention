package com.otoki.uptention.application.gift.service;

import com.otoki.uptention.application.gift.dto.response.GiftHistoryCursorResponseDto;
import com.otoki.uptention.domain.order.enums.GiftStatus;

public interface GiftAppService {
	GiftHistoryCursorResponseDto getGiftHistory(String cursorStr, int size, GiftStatus type);
}