package com.otoki.uptention.application.item.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.item.dto.request.ItemCreateRequestDto;
import com.otoki.uptention.application.item.dto.response.ItemCursorResponseDto;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.enums.SortType;

public interface ItemAppService {

	Item createItem(ItemCreateRequestDto itemCreateRequestDto, List<MultipartFile> images);

	void deleteItem(Integer itemId);

	ItemResponseDto getItemDetails(Integer itemId);

	ItemCursorResponseDto getItems(Integer categoryId, String keyword, String cursorStr, SortType sortType, int size);

}
