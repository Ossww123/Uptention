package com.otoki.uptention.application.item.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemAppServiceImpl implements ItemAppService {

	private final ItemService itemService;

	@Override
	public ItemResponseDto getItemDetails(Integer itemId) {
		Item item = itemService.getItemDetails(itemId)
			.orElseThrow(() -> new CustomException(ErrorCode.ITEM_NOT_FOUND)); // CustomException 던지기

		return ItemResponseDto.from(item, item.getImages());
	}

}
