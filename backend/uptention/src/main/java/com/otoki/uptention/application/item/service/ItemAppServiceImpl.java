package com.otoki.uptention.application.item.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.item.dto.response.ItemListResponseDto;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.domain.item.dto.CursorDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.enums.SortType;
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

	@Override
	public ItemListResponseDto getItems(Integer categoryId, String keyword, String cursorStr,
		SortType sortType, int size) {
		// 커서 디코딩
		CursorDto cursor = CursorDto.decode(cursorStr);

		// 아이템 조회 (size + 1개를 조회하여 다음 페이지 여부 확인)
		List<ItemDto> items = itemService.findItemsByCursor(categoryId, keyword, cursor, sortType, size + 1);

		// 다음 페이지 여부 확인
		boolean hasNextPage = items.size() > size;

		// 요청한 size만큼만 반환
		List<ItemDto> resultItems = hasNextPage ? items.subList(0, size) : items;

		// 다음 커서 생성
		String nextCursor = hasNextPage && !resultItems.isEmpty()
			? createNextCursor(resultItems.get(resultItems.size() - 1), sortType)
			: null;

		return new ItemListResponseDto(resultItems, hasNextPage, nextCursor);
	}

	private String createNextCursor(ItemDto lastItem, SortType sortType) {
		Integer value = switch (sortType) {
			case SALES -> lastItem.getSalesCount();
			case HIGH_PRICE, LOW_PRICE -> lastItem.getPrice();
			default -> throw new IllegalArgumentException("지원하지 않는 정렬 방식입니다.");
		};

		return new CursorDto(value, lastItem.getItemId()).encode();
	}
}