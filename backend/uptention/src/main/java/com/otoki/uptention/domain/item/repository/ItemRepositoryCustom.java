package com.otoki.uptention.domain.item.repository;

import java.util.List;

import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.enums.SortType;

public interface ItemRepositoryCustom {
	List<ItemDto> findItemsByCursor(Integer categoryId, String keyword, CursorDto<Integer> cursor, SortType sortType, int size);

	List<ItemDto> findItemsWithThumbnailByIds(List<Integer> itemIds);
}
