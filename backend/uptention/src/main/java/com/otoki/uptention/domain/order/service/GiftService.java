package com.otoki.uptention.domain.order.service;

import java.util.List;

import com.otoki.uptention.domain.order.dto.GiftItemDto;
import com.otoki.uptention.domain.order.entity.Gift;
import com.otoki.uptention.domain.order.enums.GiftStatus;

public interface GiftService {
	Gift saveGift(Gift gift);

	Gift findGiftByOrderId(Integer orderId);

	List<GiftItemDto> getReceivedGiftsByStatusWithLimit(Integer userId, GiftStatus status, int limit);

	List<GiftItemDto> getReceivedGiftsByStatusAfterCursor(Integer userId, GiftStatus status, Integer cursorId,
		int limit);
}
