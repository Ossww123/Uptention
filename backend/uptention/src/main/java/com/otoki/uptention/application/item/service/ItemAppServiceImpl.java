package com.otoki.uptention.application.item.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;

import lombok.RequiredArgsConstructor;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class ItemAppServiceImpl implements ItemAppService {

	private final ItemService itemService;

	@Override
	public ItemResponseDto getItemDetails(Integer itemId) {
		Item item = itemService.getItemDetails(itemId);

		return ItemResponseDto.from(item, item.getImages());
	}
}
