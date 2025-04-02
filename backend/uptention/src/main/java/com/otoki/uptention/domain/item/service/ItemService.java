package com.otoki.uptention.domain.item.service;

import java.util.List;

import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.enums.SortType;

public interface ItemService {

	Item saveItem(Item item);

	Item getItemById(Integer id);

	List<ItemDto> getItemsByCursor(Integer categoryId, String keyword, CursorDto cursor, SortType sortType, int size);

	List<ItemDto> getItemsByIds(List<Integer> itemIds);

}
