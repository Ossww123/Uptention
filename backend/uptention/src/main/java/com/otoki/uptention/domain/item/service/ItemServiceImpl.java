package com.otoki.uptention.domain.item.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.repository.ItemRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

	private final ItemRepository itemRepository;

	@Override
	public Item getItemDetails(Integer itemId) {
		return itemRepository.findActiveByIdWithImages(itemId)
			.orElseThrow(() -> new CustomException(ErrorCode.ITEM_NOT_FOUND));
	}
}
