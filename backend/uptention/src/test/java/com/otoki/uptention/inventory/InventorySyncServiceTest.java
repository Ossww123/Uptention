package com.otoki.uptention.inventory;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
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
import com.otoki.uptention.global.lock.DistributedLockManager;

@ExtendWith(MockitoExtension.class)
public class InventorySyncServiceTest {

	@Mock
	private ItemService itemService;

	@Mock
	private InventoryService inventoryService;

	@Mock(lenient = true)  // lenient 모드 설정
	private DistributedLockManager lockManager;

	@InjectMocks
	private InventorySyncServiceImpl inventorySyncService;

	@BeforeEach
	void setUp() {
		// 중요: executeWithLock 호출 시 람다가 실행되도록 설정
		doAnswer(invocation -> {
			Runnable runnable = invocation.getArgument(3);
			runnable.run();  // 이 부분이 중요함
			return null;
		}).when(lockManager).executeWithLock(anyString(), anyInt(), anyInt(), any(Runnable.class));
	}

	@Test
	@DisplayName("애플리케이션 시작 시 모든 아이템의 재고를 Redis에 초기화한다")
	void initializeAllInventories() {
		// given
		Item item1 = Item.builder().id(1).quantity(10).build();
		Item item2 = Item.builder().id(2).quantity(20).build();
		Item item3 = Item.builder().id(3).quantity(30).build();

		List<Item> items = Arrays.asList(item1, item2, item3);

		Map<Integer, Integer> expectedQuantities = new HashMap<>();
		expectedQuantities.put(1, 10);
		expectedQuantities.put(2, 20);
		expectedQuantities.put(3, 30);

		when(itemService.getAllItems()).thenReturn(items);

		// when
		inventorySyncService.initializeAllInventories();

		// then
		verify(itemService, times(1)).getAllItems();
		verify(inventoryService, times(1)).initializeInventories(expectedQuantities);
	}

	@Test
	@DisplayName("주기적으로 Redis 재고 정보를 DB에 동기화한다")
	void syncAllInventoriesToDatabase() {
		// given
		Item item1 = mock(Item.class);
		when(item1.getId()).thenReturn(1);

		Item item2 = mock(Item.class);
		when(item2.getId()).thenReturn(2);

		List<Item> items = Arrays.asList(item1, item2);

		InventoryDto inventory1 = InventoryDto.builder()
			.itemId(1)
			.quantity(15) // 변경된 재고
			.reservedQuantity(2)
			.availableQuantity(13)
			.build();

		InventoryDto inventory2 = InventoryDto.builder()
			.itemId(2)
			.quantity(18) // 변경된 재고
			.reservedQuantity(3)
			.availableQuantity(15)
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

		// 실제 DB Item 엔티티의 수량이 Redis 재고 수량으로 업데이트되었는지 확인
		verify(item1, times(1)).updateQuantity(15);
		verify(item2, times(1)).updateQuantity(18);
	}

	@Test
	@DisplayName("Redis 조회 중 예외 발생 시 해당 아이템은 건너뛴다")
	void syncAllInventoriesToDatabase_SkipOnException() {
		// given
		Item item1 = mock(Item.class);
		when(item1.getId()).thenReturn(1);

		Item item2 = mock(Item.class);
		when(item2.getId()).thenReturn(2);

		Item item3 = mock(Item.class);
		when(item3.getId()).thenReturn(3);

		List<Item> items = Arrays.asList(item1, item2, item3);

		InventoryDto inventory1 = InventoryDto.builder()
			.itemId(1)
			.quantity(15)
			.reservedQuantity(2)
			.availableQuantity(13)
			.build();

		// item2는 예외 발생
		when(itemService.getAllItems()).thenReturn(items);
		when(inventoryService.getInventory(1)).thenReturn(inventory1);
		when(inventoryService.getInventory(2)).thenThrow(new RuntimeException("Redis 오류"));
		when(inventoryService.getInventory(3)).thenReturn(null); // 값이 없는 경우

		// when
		inventorySyncService.syncAllInventoriesToDatabase();

		// then
		verify(itemService, times(1)).getAllItems();
		verify(inventoryService, times(1)).getInventory(1);
		verify(inventoryService, times(1)).getInventory(2);
		verify(inventoryService, times(1)).getInventory(3);

		// item1만 업데이트 성공
		verify(item1, times(1)).updateQuantity(15);
		verify(item2, never()).updateQuantity(anyInt());
		verify(item3, never()).updateQuantity(anyInt());
	}
}