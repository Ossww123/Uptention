package com.otoki.uptention.application.item.service;

import com.otoki.uptention.application.item.dto.response.ItemListResponseDto;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.domain.item.enums.SortType;

public interface ItemAppService {

	ItemResponseDto getItemDetails(Integer itemId);

	ItemListResponseDto getItems(Integer categoryId, String keyword, String cursorStr, SortType sortType, int size);

}
