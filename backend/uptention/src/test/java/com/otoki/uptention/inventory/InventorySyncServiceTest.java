package com.otoki.uptention.inventory;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.otoki.uptention.domain.inventory.dto.InventoryDto;
import com.otoki.uptention.domain.inventory.service.InventoryService;
import com.otoki.uptention.domain.inventory.service.InventorySyncServiceImpl;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;

@ExtendWith(MockitoExtension.class)
public class InventorySyncServiceTest {

	@Mock
	private InventoryService inventoryService;

	@Mock
	private ItemService itemService;

	@InjectMocks
	private InventorySyncServiceImpl inventorySyncService;

	@Test
	@DisplayName("모든 상품의 재고를 Redis에 초기화한다")
	void initializeAllInventories_Success() {
		// given
		Item item1 = Item.builder().id(1).quantity(10).build();
		Item item2 = Item.builder().id(2).quantity(20).build();
		List<Item> items = Arrays.asList(item1, item2);

		when(itemService.getAllItems()).thenReturn(items);

		// when
		inventorySyncService.initializeAllInventories();

		// then
		verify(itemService, times(1)).getAllItems();
		verify(inventoryService, times(1)).initializeInventories(anyMap());
	}

	@Test
	@DisplayName("상품의 재고를 데이터베이스에 동기화한다")
	void syncInventoryToDatabase_Success() {
		// given
		Integer itemId = 1;
		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(2)
			.availableQuantity(8)
			.build();

		Item item = Item.builder()
			.id(itemId)
			.quantity(5) // 기존 수량
			.build();

		when(inventoryService.getInventory(itemId)).thenReturn(inventoryDto);
		when(itemService.getItemById(itemId)).thenReturn(item);

		// when
		inventorySyncService.syncInventoryToDatabase(itemId);

		// then
		verify(inventoryService, times(1)).getInventory(itemId);
		verify(itemService, times(1)).getItemById(itemId);
		verify(itemService, times(1)).saveItem(item);

		// 아이템의 재고가 Redis의 재고로 업데이트되었는지 확인
		assertThat(item.getQuantity()).isEqualTo(10);
	}

	@Test
	@DisplayName("모든 상품의 재고를 데이터베이스에 동기화한다")
	void syncAllInventoriesToDatabase_Success() {
		// given
		Item item1 = Item.builder().id(1).quantity(5).build();
		Item item2 = Item.builder().id(2).quantity(15).build();
		List<Item> items = Arrays.asList(item1, item2);

		InventoryDto inventory1 = InventoryDto.builder()
			.itemId(1)
			.quantity(10)
			.reservedQuantity(0)
			.availableQuantity(10)
			.build();

		InventoryDto inventory2 = InventoryDto.builder()
			.itemId(2)
			.quantity(20)
			.reservedQuantity(0)
			.availableQuantity(20)
			.build();

		when(itemService.getAllItems()).thenReturn(items);
		when(inventoryService.getInventory(1)).thenReturn(inventory1);
		when(inventoryService.getInventory(2)).thenReturn(inventory2);

		// when
		inventorySyncService.syncAllInventoriesToDatabase();

		// then
		verify(itemService, times(1)).getAllItems();
		verify(inventoryService, times(1)).getInventory(1);
		verify(inventoryService, times(1)).getInventory(2);
		verify(itemService, times(2)).saveItem(any(Item.class));

		// 아이템들의 재고가 Redis의 재고로 업데이트되었는지 확인
		assertThat(item1.getQuantity()).isEqualTo(10);
		assertThat(item2.getQuantity()).isEqualTo(20);
	}

	@Test
	@DisplayName("상품의 재고를 Redis에 동기화한다")
	void syncInventoryFromDatabase_Success() {
		// given
		Integer itemId = 1;
		Item item = Item.builder()
			.id(itemId)
			.quantity(10)
			.build();

		when(itemService.getItemById(itemId)).thenReturn(item);

		// when
		inventorySyncService.syncInventoryFromDatabase(itemId);

		// then
		verify(itemService, times(1)).getItemById(itemId);
		verify(inventoryService, times(1)).updateInventory(itemId, 10);
	}
}