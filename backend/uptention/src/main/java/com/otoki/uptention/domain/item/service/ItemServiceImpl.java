package com.otoki.uptention.domain.item.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.common.CursorDto;
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
	public Item saveItem(Item item) {
		return itemRepository.save(item);
	}

	@Override
	public Item getItemById(Integer id) {
		// 먼저 ID만으로 조회 (status 상관없이)
		Item item = itemRepository.findById(id)
			.orElseThrow(() -> new CustomException(ErrorCode.ITEM_NOT_FOUND)); // "상품이 존재하지 않습니다"

		// 그 다음 status 확인
		if (!item.getStatus()) {
			throw new CustomException(ErrorCode.ITEM_UNAVAILABLE); // "삭제된 상품입니다"
		}

		return item;
	}

	@Override
	public List<ItemDto> getItemsByCursor(Integer categoryId, String keyword,
		CursorDto cursor, SortType sortType, int size) {
		return itemRepository.findItemsByCursor(categoryId, keyword, cursor, sortType, size);
	}

	/**
	 * 여러 상품 ID로 상품 목록 조회
	 */
	@Override
	public List<ItemDto> getItemsByIds(List<Integer> itemIds) {
		if (itemIds == null || itemIds.isEmpty()) {
			return new ArrayList<>();
		}

		// ID 목록으로 상품 조회
		return itemRepository.findItemsWithThumbnailByIds(itemIds);
	}

}
