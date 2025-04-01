package com.otoki.uptention.item;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.repository.ItemRepository;
import com.otoki.uptention.domain.item.service.ItemServiceImpl;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
public class ItemServiceTest {

	@Mock
	private ItemRepository itemRepository;

	@InjectMocks
	private ItemServiceImpl itemService;

	@Test
	@DisplayName("상품 ID로 조회할 때 상품이 존재하지 않으면 ITEM_NOT_FOUND 예외가 발생한다")
	void testGetItemDetails_ItemDoesNotExist() {
		// given
		Integer itemId = 2;
		when(itemRepository.findById(itemId)).thenReturn(Optional.empty());

		// when & then
		assertThatThrownBy(() -> itemService.getItemById(itemId))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.ITEM_NOT_FOUND);
	}

	@Test
	@DisplayName("상품 ID로 조회할 때 상품이 비활성화 상태면 ITEM_UNAVAILABLE 예외가 발생한다")
	void testGetItemDetails_ItemInactive() {
		// given
		Integer itemId = 3;
		Item inactiveItem = Item.builder()
			.id(itemId)
			.name("비활성 상품")
			.status(false) // 비활성화 상태
			.build();
		when(itemRepository.findById(itemId)).thenReturn(Optional.of(inactiveItem));

		// when & then
		assertThatThrownBy(() -> itemService.getItemById(itemId))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.ITEM_UNAVAILABLE);
	}

	@Test
	@DisplayName("상품 ID로 조회할 때 활성화된 상품이 존재하면 해당 상품을 반환한다")
	void testGetItemDetails_ItemExists() {
		// given
		Integer itemId = 1;
		Item expectedItem = Item.builder()
			.id(itemId)
			.name("테스트 상품")
			.status(true) // 활성화 상태
			.build();
		when(itemRepository.findById(itemId)).thenReturn(Optional.of(expectedItem));

		// when
		Item actualItem = itemService.getItemById(itemId);

		// then
		assertThat(actualItem).isNotNull();
		assertThat(actualItem.getId()).isEqualTo(expectedItem.getId());
	}

	@Test
	@DisplayName("상품 ID 목록으로 상품과 첫 번째 이미지만 조회한다")
	void getItemsByIds_ReturnsItemDtoList() {
		// given
		List<Integer> itemIds = Arrays.asList(1, 2);

		// 모의 ItemDto 객체 생성
		ItemDto item1 = ItemDto.builder()
			.itemId(1)
			.name("테스트 상품 1")
			.price(10000)
			.brand("브랜드 1")
			.quantity(10)
			.salesCount(5)
			.status(true)
			.thumbnail("http://example.com/image1.jpg")
			.build();

		ItemDto item2 = ItemDto.builder()
			.itemId(2)
			.name("테스트 상품 2")
			.price(20000)
			.brand("브랜드 2")
			.quantity(20)
			.salesCount(10)
			.status(true)
			.thumbnail("http://example.com/image2.jpg")
			.build();

		List<ItemDto> expectedItems = Arrays.asList(item1, item2);

		// Repository 메서드 호출 시 예상 결과 설정
		when(itemRepository.findItemsWithThumbnailByIds(itemIds)).thenReturn(expectedItems);

		// when
		List<ItemDto> result = itemService.getItemsByIds(itemIds);

		// then
		assertThat(result).isNotNull();
		assertThat(result).hasSize(2);
		assertThat(result).isEqualTo(expectedItems);

		// Repository 메서드 호출 검증
		verify(itemRepository, times(1)).findItemsWithThumbnailByIds(itemIds);
	}

	@Test
	@DisplayName("빈 상품 ID 목록으로 조회하면 빈 목록을 반환한다")
	void getItemsByIds_WithEmptyList_ReturnsEmptyList() {
		// given
		List<Integer> emptyItemIds = Collections.emptyList();

		// 빈 목록에 대해 Repository가 호출되면 안됨

		// when
		List<ItemDto> result = itemService.getItemsByIds(emptyItemIds);

		// then
		assertThat(result).isNotNull();
		assertThat(result).isEmpty();

		// Repository 메서드 호출되지 않음 검증
		verify(itemRepository, never()).findItemsWithThumbnailByIds(any());
	}

	@Test
	@DisplayName("null 상품 ID 목록으로 조회하면 빈 목록을 반환한다")
	void getItemsByIds_WithNullList_ReturnsEmptyList() {
		// given
		List<Integer> nullItemIds = null;

		// null 목록에 대해 Repository가 호출되면 안됨

		// when
		List<ItemDto> result = itemService.getItemsByIds(nullItemIds);

		// then
		assertThat(result).isNotNull();
		assertThat(result).isEmpty();

		// Repository 메서드 호출되지 않음 검증
		verify(itemRepository, never()).findItemsWithThumbnailByIds(any());
	}

	@Test
	@DisplayName("Repository가 빈 목록을 반환하면 빈 목록을 그대로 반환한다")
	void getItemsByIds_WhenRepositoryReturnsEmptyList() {
		// given
		List<Integer> itemIds = Arrays.asList(999, 1000); // 존재하지 않는 ID들

		// Repository가 빈 목록 반환하도록 설정
		when(itemRepository.findItemsWithThumbnailByIds(itemIds)).thenReturn(Collections.emptyList());

		// when
		List<ItemDto> result = itemService.getItemsByIds(itemIds);

		// then
		assertThat(result).isNotNull();
		assertThat(result).isEmpty();

		// Repository 호출 검증
		verify(itemRepository, times(1)).findItemsWithThumbnailByIds(itemIds);
	}
}
