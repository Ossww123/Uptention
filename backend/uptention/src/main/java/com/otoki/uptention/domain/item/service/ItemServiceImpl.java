package com.otoki.uptention.domain.item.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.item.dto.CursorDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.enums.SortType;
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

	public List<ItemDto> findItemsByCursor(Integer categoryId, String keyword,
		CursorDto cursor, SortType sortType, int size) {
		return itemRepository.findItemsByCursor(categoryId, keyword, cursor, sortType, size);
	}
}
