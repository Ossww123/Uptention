package com.otoki.uptention.application.item.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.item.dto.response.ItemListResponseDto;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.domain.category.service.CategoryService;
import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.enums.SortType;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class ItemAppServiceImpl implements ItemAppService {

	private final ItemService itemService;
	private final CategoryService categoryService;

	/**
	 * 상품의 상세 정보 조회
	 */
	@Override
	public ItemResponseDto getItemDetails(Integer itemId) {
		Item item = itemService.getItemById(itemId);
		return ItemResponseDto.from(item, item.getImages());
	}

	/**
	 * 조건에 맞는 상품 목록을 커서 기반 페이징으로 조회
	 */
	@Override
	public ItemListResponseDto getItems(Integer categoryId, String keyword, String cursorStr,
		SortType sortType, int size) {

		// 카테고리 존재 여부 검증
		if (categoryId != null && !categoryService.isCategoryExists(categoryId)) {
			throw new CustomException(ErrorCode.ITEM_CATEGORY_NOT_FOUND);
		}

		// 커서 디코딩
		CursorDto cursor = CursorDto.decode(cursorStr);

		// 아이템 조회 (size + 1개를 조회하여 다음 페이지 여부 확인)
		List<ItemDto> items = itemService.getItemsByCursor(categoryId, keyword, cursor, sortType, size + 1);

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

	/**
	 * 다음 페이지 조회를 위한 커서 생성
	 */
	private String createNextCursor(ItemDto lastItem, SortType sortType) {
		Integer value;

		if (sortType == SortType.SALES) {
			value = lastItem.getSalesCount();
		} else if (sortType == SortType.HIGH_PRICE || sortType == SortType.LOW_PRICE) {
			value = lastItem.getPrice();
		} else {
			throw new CustomException(ErrorCode.ITEM_INVALID_SORT_TYPE);
		}

		return new CursorDto(value, lastItem.getItemId()).encode();
	}
}