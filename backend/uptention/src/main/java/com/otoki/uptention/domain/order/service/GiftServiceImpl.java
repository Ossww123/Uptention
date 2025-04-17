package com.otoki.uptention.domain.order.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.order.dto.GiftItemDto;
import com.otoki.uptention.domain.order.entity.Gift;
import com.otoki.uptention.domain.order.enums.GiftStatus;
import com.otoki.uptention.domain.order.repository.GiftRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GiftServiceImpl implements GiftService {
	private final GiftRepository giftRepository;

	@Override
	public Gift saveGift(Gift gift) {
		return giftRepository.save(gift);
	}

	@Override
	public Gift findGiftByOrderId(Integer orderId) {
		return giftRepository.findByOrderId(orderId).orElse(null);
	}

	@Override
	public List<GiftItemDto> getReceivedGiftsByStatusWithLimit(Integer userId, GiftStatus status, int limit) {
		return giftRepository.findReceivedGiftsByUserIdAndStatusWithLimit(userId, status, limit);
	}

	@Override
	public List<GiftItemDto> getReceivedGiftsByStatusAfterCursor(Integer userId, GiftStatus status, Integer cursorId,
		int limit) {
		return giftRepository.findReceivedGiftsByUserIdAndStatusAndCursor(userId, status, cursorId, limit);
	}
}
