package com.otoki.uptention.domain.order.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.order.entity.Gift;
import com.otoki.uptention.domain.order.repository.GiftRespository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GiftServiceImpl implements GiftService{
	private final GiftRespository giftRepository;

	@Override
	public Gift save(Gift gift) {
		return giftRepository.save(gift);
	}
}
