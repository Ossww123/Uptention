package com.otoki.uptention.domain.item.service;

import java.util.List;

import com.otoki.uptention.domain.item.dto.CursorDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.enums.SortType;

public interface ItemService {
	Item getItemDetails(Integer itemId);

	List<ItemDto> findItemsByCursor(Integer categoryId, String keyword, CursorDto cursor, SortType sortType, int size);
}
