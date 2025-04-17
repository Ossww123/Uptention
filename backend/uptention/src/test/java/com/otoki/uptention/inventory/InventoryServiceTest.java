package com.otoki.uptention.inventory;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import com.otoki.uptention.domain.item.dto.InventoryDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.repository.ItemRepository;
import com.otoki.uptention.domain.item.service.InventoryServiceImpl;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
public class InventoryServiceTest {

	@Mock
	private RedisTemplate<String, Object> redisTemplate;

	@Mock
	private ValueOperations<String, Object> valueOperations;

	@Mock
	private RedissonClient redissonClient;

	@Mock
	private RLock lock;

	@Mock
	private ItemRepository itemRepository;

	@InjectMocks
	private InventoryServiceImpl inventoryService;

	@Test
	@DisplayName("재고 초기화가 성공적으로 수행된다")
	void initializeInventory_Success() {
		// given
		Integer itemId = 1;
		Integer quantity = 10;
		String key = "inventory:1";

		when(redisTemplate.opsForValue()).thenReturn(valueOperations);

		// when
		inventoryService.initializeInventory(itemId, quantity);

		// then
		verify(redisTemplate, times(1)).opsForValue();
		verify(valueOperations, times(1)).set(eq(key), any(InventoryDto.class));
	}

	@Test
	@DisplayName("여러 상품의 재고를 일괄 초기화한다")
	void initializeInventories_Success() {
		// given
		Map<Integer, Integer> itemQuantities = new HashMap<>();
		itemQuantities.put(1, 10);
		itemQuantities.put(2, 20);

		when(redisTemplate.opsForValue()).thenReturn(valueOperations);

		// when
		inventoryService.initializeInventories(itemQuantities);

		// then
		verify(redisTemplate, times(2)).opsForValue();
		verify(valueOperations, times(1)).set(eq("inventory:1"), any(InventoryDto.class));
		verify(valueOperations, times(1)).set(eq("inventory:2"), any(InventoryDto.class));
	}

	@Test
	@DisplayName("재고 조회가 성공적으로 수행된다")
	void getInventory_Success() {
		// given
		Integer itemId = 1;
		String key = "inventory:1";
		InventoryDto expectedDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(2)
			.availableQuantity(8)
			.build();

		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(expectedDto);

		// when
		InventoryDto result = inventoryService.getInventory(itemId);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getItemId()).isEqualTo(itemId);
		assertThat(result.getQuantity()).isEqualTo(10);
		assertThat(result.getReservedQuantity()).isEqualTo(2);
		assertThat(result.getAvailableQuantity()).isEqualTo(8);

		verify(redisTemplate, times(1)).opsForValue();
		verify(valueOperations, times(1)).get(key);
	}

	@Test
	@DisplayName("재고가 Redis에 없을 경우 DB에서 초기화를 시도한다")
	void getInventory_InitializeFromDB() {
		// given
		Integer itemId = 999;
		String key = "inventory:999";

		Item item = Item.builder()
			.id(itemId)
			.quantity(20)
			.status(true)
			.build();

		InventoryDto expectedDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(20)
			.reservedQuantity(0)
			.availableQuantity(20)
			.build();

		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		// 첫 호출에서 null, 두 번째 호출에서 데이터 반환
		when(valueOperations.get(key)).thenReturn(null).thenReturn(expectedDto);
		when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));

		// 초기화 시 set 메소드 호출을 모킹
		doAnswer(invocation -> null).when(valueOperations).set(eq(key), any(InventoryDto.class));

		// when
		InventoryDto result = inventoryService.getInventory(itemId);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getItemId()).isEqualTo(itemId);
		assertThat(result.getQuantity()).isEqualTo(20);

		// DB에서 초기화 시도 확인
		verify(itemRepository, times(1)).findById(itemId);
		// 초기화 시 값을 설정하는 부분 확인
		verify(valueOperations, times(1)).set(eq(key), any(InventoryDto.class));
		// 두 번 호출 (초기 조회 + 초기화 후 재조회)
		verify(valueOperations, times(2)).get(key);
	}

	@Test
	@DisplayName("Redis와 DB 모두에 재고가 없는 경우 예외가 발생한다")
	void getInventory_NotFoundInBoth() {
		// given
		Integer itemId = 999;
		String key = "inventory:999";

		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(null);
		when(itemRepository.findById(itemId)).thenReturn(Optional.empty());

		// when & then
		assertThatThrownBy(() -> inventoryService.getInventory(itemId))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.ITEM_NOT_FOUND);

		verify(redisTemplate, times(1)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(itemRepository, times(1)).findById(itemId);
	}

	@Test
	@DisplayName("비활성화된 상품인 경우 예외가 발생한다")
	void getInventory_ItemUnavailable() {
		// given
		Integer itemId = 999;
		String key = "inventory:999";

		Item item = Item.builder()
			.id(itemId)
			.quantity(20)
			.status(false) // 비활성화된 상품
			.build();

		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(null);
		when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));

		// when & then
		assertThatThrownBy(() -> inventoryService.getInventory(itemId))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVENTORY_SYNC_FAILED);

		verify(redisTemplate, times(1)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(itemRepository, times(1)).findById(itemId);
	}

	@Test
	@DisplayName("재고 예약이 성공적으로 수행된다")
	void reserveInventory_Success() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer quantity = 2;
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(0)
			.availableQuantity(10)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);

		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(true);
		// when
		boolean result = inventoryService.reserveInventory(itemId, quantity);

		// then
		assertThat(result).isTrue();
		assertThat(inventoryDto.getReservedQuantity()).isEqualTo(2);
		assertThat(inventoryDto.getAvailableQuantity()).isEqualTo(8);

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(2)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(valueOperations, times(1)).set(eq(key), any(InventoryDto.class));
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(1)).unlock();
	}

	@Test
	@DisplayName("재고가 부족하면 예약에 실패한다")
	void reserveInventory_InsufficientStock() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer quantity = 15; // 재고보다 많은 수량
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(0)
			.availableQuantity(10)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);

		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(true);
		// when
		boolean result = inventoryService.reserveInventory(itemId, quantity);

		// then
		assertThat(result).isFalse();
		assertThat(inventoryDto.getReservedQuantity()).isEqualTo(0); // 변경되지 않음
		assertThat(inventoryDto.getAvailableQuantity()).isEqualTo(10); // 변경되지 않음

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(1)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(valueOperations, times(0)).set(eq(key), any(InventoryDto.class));
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(1)).unlock();
	}

	@Test
	@DisplayName("락 획득에 실패하면 예외가 발생한다")
	void reserveInventory_LockAcquisitionFailed() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer quantity = 2;
		String lockKey = "inventory:lock:1";

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(false);

		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(false); // 락을 획득하지 못했으므로 false 반환

		// when & then
		assertThatThrownBy(() -> inventoryService.reserveInventory(itemId, quantity))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVENTORY_LOCK_ACQUISITION_FAILED);

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(0)).opsForValue();
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(0)).unlock();
	}

	@Test
	@DisplayName("재고 예약 확정이 성공적으로 수행된다")
	void confirmInventory_Success() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer quantity = 2;
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(5) // 5개 예약됨
			.availableQuantity(5)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);

		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(true);
		// when
		boolean result = inventoryService.confirmInventory(itemId, quantity);

		// then
		assertThat(result).isTrue();
		assertThat(inventoryDto.getQuantity()).isEqualTo(8); // 10 - 2 = 8
		assertThat(inventoryDto.getReservedQuantity()).isEqualTo(3); // 5 - 2 = 3
		assertThat(inventoryDto.getAvailableQuantity()).isEqualTo(5); // 동일

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(2)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(valueOperations, times(1)).set(eq(key), any(InventoryDto.class));
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(1)).unlock();
	}

	@Test
	@DisplayName("예약된 수량보다 많은 수량을 확정하려고 하면 실패한다")
	void confirmInventory_ReservedQuantityExceeded() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer quantity = 10; // 예약된 수량(5)보다 많음
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(5) // 5개만 예약됨
			.availableQuantity(5)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);

		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(true);
		// when
		boolean result = inventoryService.confirmInventory(itemId, quantity);

		// then
		assertThat(result).isFalse();
		assertThat(inventoryDto.getQuantity()).isEqualTo(10); // 변경되지 않음
		assertThat(inventoryDto.getReservedQuantity()).isEqualTo(5); // 변경되지 않음
		assertThat(inventoryDto.getAvailableQuantity()).isEqualTo(5); // 변경되지 않음

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(1)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(valueOperations, times(0)).set(eq(key), any(InventoryDto.class));
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(1)).unlock();
	}

	@Test
	@DisplayName("재고 예약 취소가 성공적으로 수행된다")
	void cancelReservation_Success() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer quantity = 2;
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(5) // 5개 예약됨
			.availableQuantity(5)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);
		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(true);

		// when
		boolean result = inventoryService.cancelReservation(itemId, quantity);

		// then
		assertThat(result).isTrue();
		assertThat(inventoryDto.getQuantity()).isEqualTo(10); // 변경 없음
		assertThat(inventoryDto.getReservedQuantity()).isEqualTo(3); // 5 - 2 = 3
		assertThat(inventoryDto.getAvailableQuantity()).isEqualTo(7); // 10 - 3 = 7

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(2)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(valueOperations, times(1)).set(eq(key), any(InventoryDto.class));
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(1)).unlock();
	}

	@Test
	@DisplayName("재고 업데이트가 성공적으로 수행된다")
	void updateInventory_Success() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer newAvailableQuantity = 20; // 가용 재고 20으로 변경
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(2)
			.availableQuantity(8)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);

		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(true);

		// set 메소드 호출 시 inventoryDto 객체를 업데이트하도록 모킹
		doAnswer(invocation -> {
			InventoryDto dto = invocation.getArgument(1);
			// dto 값 확인
			return null;
		}).when(valueOperations).set(eq(key), any(InventoryDto.class));

		// when
		inventoryService.updateInventory(itemId, newAvailableQuantity);

		// then
		// 변경: 새로운 가용 재고 + 예약 재고 = 새로운 총 재고
		assertThat(inventoryDto.getQuantity()).isEqualTo(22); // 20 + 2 = 22
		assertThat(inventoryDto.getReservedQuantity()).isEqualTo(2); // 변경 없음
		assertThat(inventoryDto.getAvailableQuantity()).isEqualTo(20); // 설정된 값으로 변경

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(2)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(valueOperations, times(1)).set(eq(key), any(InventoryDto.class));
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(1)).unlock();
	}

	@Test
	@DisplayName("재고 증가가 성공적으로 수행된다")
	void increaseInventory_Success() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer increaseQuantity = 5;
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(2)
			.availableQuantity(8)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);
		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(true);

		// when
		inventoryService.increaseInventory(itemId, increaseQuantity);

		// then
		assertThat(inventoryDto.getQuantity()).isEqualTo(15); // 10 + 5 = 15
		assertThat(inventoryDto.getReservedQuantity()).isEqualTo(2); // 변경 없음
		assertThat(inventoryDto.getAvailableQuantity()).isEqualTo(13); // 15 - 2 = 13

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(2)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(valueOperations, times(1)).set(eq(key), any(InventoryDto.class));
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(1)).unlock();
	}

	@Test
	@DisplayName("재고 감소가 성공적으로 수행된다")
	void decreaseInventory_Success() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer decreaseQuantity = 3;
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(2)
			.availableQuantity(8)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);
		// lock.isHeldByCurrentThread()가 true를 반환하도록 설정
		when(lock.isHeldByCurrentThread()).thenReturn(true);

		// when
		inventoryService.decreaseInventory(itemId, decreaseQuantity);

		// then
		assertThat(inventoryDto.getQuantity()).isEqualTo(7); // 10 - 3 = 7
		assertThat(inventoryDto.getReservedQuantity()).isEqualTo(2); // 변경 없음
		assertThat(inventoryDto.getAvailableQuantity()).isEqualTo(5); // 7 - 2 = 5

		verify(redissonClient, times(1)).getLock(lockKey);
		verify(lock, times(1)).tryLock(anyLong(), anyLong(), any(TimeUnit.class));
		verify(redisTemplate, times(2)).opsForValue();
		verify(valueOperations, times(1)).get(key);
		verify(valueOperations, times(1)).set(eq(key), any(InventoryDto.class));
		verify(lock, times(1)).isHeldByCurrentThread();
		verify(lock, times(1)).unlock();
	}

	@Test
	@DisplayName("가용 재고보다 많은 재고를 감소시키려고 하면 예외가 발생한다")
	void decreaseInventory_InsufficientStock() throws InterruptedException {
		// given
		Integer itemId = 1;
		Integer decreaseQuantity = 10; // 가용 재고(8)보다 많음
		String key = "inventory:1";
		String lockKey = "inventory:lock:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(2)
			.availableQuantity(8)
			.build();

		when(redissonClient.getLock(lockKey)).thenReturn(lock);
		when(lock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);
		when(lock.isHeldByCurrentThread()).thenReturn(true);

		// when & then
		assertThatThrownBy(() -> inventoryService.decreaseInventory(itemId, decreaseQuantity))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.ITEM_INSUFFICIENT_STOCK);
	}

	@Test
	@DisplayName("재고 확인이 성공적으로 수행된다")
	void hasStock_Success() {
		// given
		Integer itemId = 1;
		Integer quantity = 5;
		String key = "inventory:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(2)
			.availableQuantity(8)
			.build();

		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);

		// when
		boolean result = inventoryService.hasStock(itemId, quantity);

		// then
		assertThat(result).isTrue();

		verify(redisTemplate, times(1)).opsForValue();
		verify(valueOperations, times(1)).get(key);
	}

	@Test
	@DisplayName("가용 재고가 부족하면 false를 반환한다")
	void hasStock_InsufficientStock() {
		// given
		Integer itemId = 1;
		Integer quantity = 10; // 가용 재고(8)보다 많음
		String key = "inventory:1";

		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(10)
			.reservedQuantity(2)
			.availableQuantity(8)
			.build();

		when(redisTemplate.opsForValue()).thenReturn(valueOperations);
		when(valueOperations.get(key)).thenReturn(inventoryDto);

		// when
		boolean result = inventoryService.hasStock(itemId, quantity);

		// then
		assertThat(result).isFalse();

		verify(redisTemplate, times(1)).opsForValue();
		verify(valueOperations, times(1)).get(key);
	}
}