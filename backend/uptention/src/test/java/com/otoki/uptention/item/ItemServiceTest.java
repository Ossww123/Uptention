package com.otoki.uptention.item;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.repository.ItemRepository;
import com.otoki.uptention.domain.item.service.ItemServiceImpl;

@ExtendWith(MockitoExtension.class)
public class ItemServiceTest {

	@Mock
	private ItemRepository itemRepository;

	@InjectMocks
	private ItemServiceImpl itemService;

	@Test
	@DisplayName("상품 ID로 조회할 때 활성화된 상품이 존재하면 해당 상품을 반환한다")
	void testGetItemDetails_ItemExists() {
		// given
		Integer itemId = 1;
		Item expectedItem = Item.builder()
			.id(itemId)
			.name("테스트 상품")
			.build();
		when(itemRepository.findActiveByIdWithImages(itemId)).thenReturn(Optional.of(expectedItem));

		// when
		Optional<Item> actualItem = itemService.getItemDetails(itemId);

		// then
		assertThat(actualItem).isPresent();
		assertThat(actualItem.get().getId()).isEqualTo(expectedItem.getId());
	}

	@Test
	@DisplayName("상품 ID로 조회할 때 활성화된 상품이 존재하지 않으면 빈 Optional을 반환한다")
	void testGetItemDetails_ItemDoesNotExist() {
		// given
		Integer itemId = 2;
		when(itemRepository.findActiveByIdWithImages(itemId)).thenReturn(Optional.empty());

		// when
		Optional<Item> actualItem = itemService.getItemDetails(itemId);

		// then
		assertThat(actualItem).isEmpty();
	}
}
