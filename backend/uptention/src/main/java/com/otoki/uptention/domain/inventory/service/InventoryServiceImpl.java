package com.otoki.uptention.domain.inventory.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.redisson.RedissonMultiLock;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.inventory.dto.InventoryDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceImpl implements InventoryService {

	private static final String INVENTORY_KEY_PREFIX = "inventory:";
	private static final String INVENTORY_LOCK_PREFIX = "inventory:lock:";
	private static final long LOCK_WAIT_TIME = 3; // 초
	private static final long LOCK_LEASE_TIME = 5; // 초

	private final RedisTemplate<String, Object> redisTemplate;
	private final RedissonClient redissonClient;
	private final ItemService itemService;

	@Override
	public void initializeInventory(Integer itemId, Integer quantity) {
		log.info("Initializing inventory for item {} with quantity {}", itemId, quantity);

		String key = INVENTORY_KEY_PREFIX + itemId;
		InventoryDto inventoryDto = InventoryDto.builder()
			.itemId(itemId)
			.quantity(quantity)
			.reservedQuantity(0)
			.availableQuantity(quantity)
			.build();

		redisTemplate.opsForValue().set(key, inventoryDto);
	}

	@Override
	public void initializeInventories(Map<Integer, Integer> itemQuantities) {
		log.info("Initializing inventories for {} items", itemQuantities.size());

		for (Map.Entry<Integer, Integer> entry : itemQuantities.entrySet()) {
			initializeInventory(entry.getKey(), entry.getValue());
		}
	}

	@Override
	public InventoryDto getInventory(Integer itemId) {
		String key = INVENTORY_KEY_PREFIX + itemId;
		Object result = redisTemplate.opsForValue().get(key);

		if (result == null) {
			log.warn("Inventory not found in Redis for item {}, attempting to initialize from database", itemId);
			try {
				// 대신 아이템 서비스를 통해 DB에서 정보를 가져와 초기화 시도
				Item item = itemService.getItemById(itemId);
				initializeInventory(itemId, item.getQuantity());

				// 다시 조회
				result = redisTemplate.opsForValue().get(key);

				if (result == null) {
					log.error("Failed to initialize and retrieve inventory for item {}", itemId);
					throw new CustomException(ErrorCode.INVENTORY_SYNC_FAILED);
				}

				log.info("Successfully initialized inventory for item {} from database", itemId);
			} catch (CustomException e) {
				// 상품 자체가 존재하지 않는 경우
				if (e.getErrorCode() == ErrorCode.ITEM_NOT_FOUND) {
					throw e;
				}
				// 그 외 오류는 재고 관련 오류로 변환
				log.error("Error initializing inventory for item {}", itemId, e);
				throw new CustomException(ErrorCode.INVENTORY_SYNC_FAILED);
			}
		}

		return (InventoryDto)result;
	}

	@Override
	public Map<Integer, InventoryDto> getInventories(List<Integer> itemIds) {
		if (itemIds == null || itemIds.isEmpty()) {
			return new HashMap<>();
		}

		Map<Integer, InventoryDto> result = new HashMap<>();
		List<String> redisKeys = itemIds.stream()
			.map(id -> INVENTORY_KEY_PREFIX + id)
			.toList();

		try {
			// 한 번의 Redis 호출로 모든 아이템 조회 시도
			List<Object> multiGetResults = redisTemplate.opsForValue().multiGet(redisKeys);

			if (multiGetResults != null) {
				for (int i = 0; i < itemIds.size(); i++) {
					Integer itemId = itemIds.get(i);
					Object value = multiGetResults.get(i);

					if (value != null) {
						result.put(itemId, (InventoryDto)value);
					} else {
						// Redis에 없는 아이템은 개별적으로 초기화 시도
						try {
							InventoryDto inventory = getInventory(itemId);
							result.put(itemId, inventory);
						} catch (Exception e) {
							log.error("Failed to initialize inventory for item {}: {}", itemId, e.getMessage());
							// 이 아이템은 결과에서 제외됨 (null이 아닌 아이템만 포함)
						}
					}
				}
			}
		} catch (Exception e) {
			log.error("Error performing multi-get operation on Redis: {}", e.getMessage());
			// Redis 일괄 조회 실패 시 개별 조회로 폴백
			for (Integer itemId : itemIds) {
				try {
					InventoryDto inventory = getInventory(itemId);
					result.put(itemId, inventory);
				} catch (Exception ex) {
					log.error("Error getting inventory for item {}", itemId, ex);
					// 이 아이템은 결과에서 제외됨
				}
			}
		}

		// 실패한 아이템 로깅
		if (result.size() < itemIds.size()) {
			List<Integer> missingItems = itemIds.stream()
				.filter(id -> !result.containsKey(id))
				.collect(Collectors.toList());
			log.warn("Could not retrieve inventory for {} items: {}", missingItems.size(), missingItems);
		}

		return result;
	}

	@Override
	public boolean reserveInventory(Integer itemId, Integer quantity) {
		String lockKey = INVENTORY_LOCK_PREFIX + itemId;
		RLock lock = redissonClient.getLock(lockKey);

		try {
			// 분산락 획득 시도
			boolean isLocked = lock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.warn("Failed to acquire lock for item {}", itemId);
				throw new CustomException(ErrorCode.INVENTORY_LOCK_ACQUISITION_FAILED);
			}

			InventoryDto inventory = getInventory(itemId);

			// 재고 확인
			if (inventory.getAvailableQuantity() < quantity) {
				log.warn("Insufficient stock for item {}: required={}, available={}",
					itemId, quantity, inventory.getAvailableQuantity());
				return false;
			}

			// 재고 예약
			inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
			inventory.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());

			String key = INVENTORY_KEY_PREFIX + itemId;
			redisTemplate.opsForValue().set(key, inventory);

			log.info("Reserved inventory for item {}: quantity={}, available={}, reserved={}",
				itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());

			return true;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("Lock acquisition interrupted for item {}", itemId, e);
			return false;
		} finally {
			if (lock.isHeldByCurrentThread()) {
				lock.unlock();
			}
		}
	}

	// 개별 예약 확정 - 개별 락
	@Override
	public boolean confirmInventory(Integer itemId, Integer quantity) {
		String lockKey = INVENTORY_LOCK_PREFIX + itemId;
		RLock lock = redissonClient.getLock(lockKey);

		try {
			boolean isLocked = lock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.warn("Failed to acquire lock for item {}", itemId);
				return false;
			}

			InventoryDto inventory = getInventory(itemId);

			// 예약된 재고가 확인한 수량보다 적으면 오류
			if (inventory.getReservedQuantity() < quantity) {
				log.warn("Reserved quantity is less than requested: item={}, reserved={}, requested={}",
					itemId, inventory.getReservedQuantity(), quantity);
				return false;
			}

			// 예약된 재고를 실제 차감
			inventory.setQuantity(inventory.getQuantity() - quantity);
			inventory.setReservedQuantity(inventory.getReservedQuantity() - quantity);
			inventory.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());

			String key = INVENTORY_KEY_PREFIX + itemId;
			redisTemplate.opsForValue().set(key, inventory);

			log.info("Confirmed inventory for item {}: quantity={}, available={}, reserved={}",
				itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());

			return true;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("Lock acquisition interrupted for item {}", itemId, e);
			return false;
		} finally {
			if (lock.isHeldByCurrentThread()) {
				lock.unlock();
			}
		}
	}

	// 개별 예약 취소 - 개별 락
	@Override
	public boolean cancelReservation(Integer itemId, Integer quantity) {
		String lockKey = INVENTORY_LOCK_PREFIX + itemId;
		RLock lock = redissonClient.getLock(lockKey);

		try {
			boolean isLocked = lock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.warn("Failed to acquire lock for item {}", itemId);
				return false;
			}

			InventoryDto inventory = getInventory(itemId);

			// 예약된 재고 취소
			inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - quantity));
			inventory.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());

			String key = INVENTORY_KEY_PREFIX + itemId;
			redisTemplate.opsForValue().set(key, inventory);

			log.info("Canceled reservation for item {}: quantity={}, available={}, reserved={}",
				itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());

			return true;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("Lock acquisition interrupted for item {}", itemId, e);
			return false;
		} finally {
			if (lock.isHeldByCurrentThread()) {
				lock.unlock();
			}
		}
	}

	@Override
	public void updateInventory(Integer itemId, Integer newQuantity) {
		String lockKey = INVENTORY_LOCK_PREFIX + itemId;
		RLock lock = redissonClient.getLock(lockKey);

		try {
			boolean isLocked = lock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.warn("Failed to acquire lock for item {}", itemId);
				throw new CustomException(ErrorCode.INVENTORY_LOCK_ACQUISITION_FAILED);
			}

			InventoryDto inventory = getInventory(itemId);

			// 새로운 가용 재고를 기준으로 전체 수량 계산
			if (newQuantity < 0) {
				throw new CustomException(ErrorCode.INVENTORY_INVALID_QUANTITY);
			}

			// 기존 예약 수량 유지하고 전체 수량 재계산
			Integer reservedQuantity = inventory.getReservedQuantity();
			Integer newTotalQuantity = newQuantity + reservedQuantity;

			// 재고 업데이트
			inventory.setQuantity(newTotalQuantity);
			inventory.setAvailableQuantity(newTotalQuantity - reservedQuantity);

			// 검증: 계산된 availableQuantity가 newAvailableQuantity와 일치하는지 확인
			if (inventory.getAvailableQuantity() != newQuantity) {
				log.warn("Calculated availableQuantity ({}) doesn't match expected newAvailableQuantity ({})",
					inventory.getAvailableQuantity(), newQuantity);
			}

			String key = INVENTORY_KEY_PREFIX + itemId;
			redisTemplate.opsForValue().set(key, inventory);

			log.info("Updated inventory for item {}: quantity={}, available={}, reserved={}",
				itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("Lock acquisition interrupted for item {}", itemId, e);
			throw new CustomException(ErrorCode.INVENTORY_LOCK_ACQUISITION_FAILED);
		} finally {
			if (lock.isHeldByCurrentThread()) {
				lock.unlock();
			}
		}
	}

	@Override
	public void increaseInventory(Integer itemId, Integer quantity) {
		String lockKey = INVENTORY_LOCK_PREFIX + itemId;
		RLock lock = redissonClient.getLock(lockKey);

		try {
			boolean isLocked = lock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.warn("Failed to acquire lock for item {}", itemId);
				throw new CustomException(ErrorCode.INVENTORY_LOCK_ACQUISITION_FAILED);
			}

			InventoryDto inventory = getInventory(itemId);
			inventory.setQuantity(inventory.getQuantity() + quantity);
			inventory.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());

			String key = INVENTORY_KEY_PREFIX + itemId;
			redisTemplate.opsForValue().set(key, inventory);

			log.info("Increased inventory for item {}: quantity={}, available={}, reserved={}",
				itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("Lock acquisition interrupted for item {}", itemId, e);
			throw new CustomException(ErrorCode.INVENTORY_LOCK_ACQUISITION_FAILED);
		} finally {
			if (lock.isHeldByCurrentThread()) {
				lock.unlock();
			}
		}
	}

	@Override
	public void decreaseInventory(Integer itemId, Integer quantity) {
		String lockKey = INVENTORY_LOCK_PREFIX + itemId;
		RLock lock = redissonClient.getLock(lockKey);

		try {
			boolean isLocked = lock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.warn("Failed to acquire lock for item {}", itemId);
				throw new CustomException(ErrorCode.INVENTORY_LOCK_ACQUISITION_FAILED);
			}

			InventoryDto inventory = getInventory(itemId);

			if (inventory.getAvailableQuantity() < quantity) {
				throw new CustomException(ErrorCode.ITEM_INSUFFICIENT_STOCK);
			}

			inventory.setQuantity(inventory.getQuantity() - quantity);
			inventory.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());

			String key = INVENTORY_KEY_PREFIX + itemId;
			redisTemplate.opsForValue().set(key, inventory);

			log.info("Decreased inventory for item {}: quantity={}, available={}, reserved={}",
				itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("Lock acquisition interrupted for item {}", itemId, e);
			throw new CustomException(ErrorCode.INVENTORY_LOCK_ACQUISITION_FAILED);
		} finally {
			if (lock.isHeldByCurrentThread()) {
				lock.unlock();
			}
		}
	}

	// 전체 예약 확정 - Multi Lock
	@Override
	public boolean confirmInventories(Map<Integer, Integer> itemQuantities) {
		if (itemQuantities == null || itemQuantities.isEmpty()) {
			return true;
		}

		log.info("Starting batch confirmation with MultiLock for {} items", itemQuantities.size());

		// 1. MultiLock 생성
		RLock[] locks = new RLock[itemQuantities.size()];
		Integer[] itemIds = itemQuantities.keySet().toArray(new Integer[0]);

		int i = 0;
		for (Integer itemId : itemIds) {
			String lockKey = INVENTORY_LOCK_PREFIX + itemId;
			locks[i++] = redissonClient.getLock(lockKey);
		}

		RedissonMultiLock multiLock = new RedissonMultiLock(locks);
		boolean isLocked = false;

		try {
			// 2. MultiLock으로 모든 락을 원자적으로 획득 시도
			isLocked = multiLock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.error("Failed to acquire MultiLock for items: {}", itemQuantities.keySet());
				return false;
			}

			// 3. 모든 아이템 재고 조회
			Map<Integer, InventoryDto> inventories = getInventories(new ArrayList<>(itemQuantities.keySet()));

			// 4. 예약 수량 검증
			for (Map.Entry<Integer, Integer> entry : itemQuantities.entrySet()) {
				Integer itemId = entry.getKey();
				Integer quantity = entry.getValue();
				InventoryDto inventory = inventories.get(itemId);

				if (inventory == null) {
					log.error("Inventory not found for item {}", itemId);
					return false;
				}

				if (inventory.getReservedQuantity() < quantity) {
					log.error("Reserved quantity is less than requested: item={}, reserved={}, requested={}",
						itemId, inventory.getReservedQuantity(), quantity);
					return false;
				}
			}

			// 5. 모든 상품 재고 확정 처리
			for (Map.Entry<Integer, Integer> entry : itemQuantities.entrySet()) {
				Integer itemId = entry.getKey();
				Integer quantity = entry.getValue();
				InventoryDto inventory = inventories.get(itemId);

				// 예약된 재고를 실제 차감
				inventory.setQuantity(inventory.getQuantity() - quantity);
				inventory.setReservedQuantity(inventory.getReservedQuantity() - quantity);
				inventory.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());

				String key = INVENTORY_KEY_PREFIX + itemId;
				redisTemplate.opsForValue().set(key, inventory);

				log.info("Confirmed inventory for item {}: quantity={}, available={}, reserved={}",
					itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());
			}

			return true;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("MultiLock acquisition interrupted", e);
			return false;
		} catch (Exception e) {
			log.error("Error during batch confirmation with MultiLock", e);
			return false;
		} finally {
			// 6. 락 해제 (획득한 경우에만)
			if (isLocked) {
				multiLock.unlock();
			}
		}
	}

	// 전체 예약 - Multi Lock
	@Override
	public boolean reserveInventories(Map<Integer, Integer> itemQuantities) {
		if (itemQuantities == null || itemQuantities.isEmpty()) {
			return true;
		}

		log.info("Starting batch reservation with MultiLock for {} items", itemQuantities.size());

		// MultiLock 생성
		RLock[] locks = new RLock[itemQuantities.size()];
		Integer[] itemIds = itemQuantities.keySet().toArray(new Integer[0]);

		int i = 0;
		for (Integer itemId : itemIds) {
			String lockKey = INVENTORY_LOCK_PREFIX + itemId;
			locks[i++] = redissonClient.getLock(lockKey);
		}

		RedissonMultiLock multiLock = new RedissonMultiLock(locks);
		boolean isLocked = false;

		try {
			// MultiLock으로 모든 락을 원자적으로 획득 시도
			isLocked = multiLock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.error("Failed to acquire MultiLock for items: {}", itemQuantities.keySet());
				return false;
			}

			// 모든 아이템 재고 조회
			Map<Integer, InventoryDto> inventories = getInventories(new ArrayList<>(itemQuantities.keySet()));

			// 재고 가능 여부 사전 검증
			for (Map.Entry<Integer, Integer> entry : itemQuantities.entrySet()) {
				Integer itemId = entry.getKey();
				Integer quantity = entry.getValue();
				InventoryDto inventory = inventories.get(itemId);

				if (inventory == null) {
					log.error("Inventory not found for item {}", itemId);
					return false;
				}

				if (inventory.getAvailableQuantity() < quantity) {
					log.error("Insufficient stock for item {}: required={}, available={}",
						itemId, quantity, inventory.getAvailableQuantity());
					return false;
				}
			}

			// 모든 상품 재고 예약 처리
			for (Map.Entry<Integer, Integer> entry : itemQuantities.entrySet()) {
				Integer itemId = entry.getKey();
				Integer quantity = entry.getValue();
				InventoryDto inventory = inventories.get(itemId);

				// 재고 예약
				inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
				inventory.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());

				String key = INVENTORY_KEY_PREFIX + itemId;
				redisTemplate.opsForValue().set(key, inventory);

				log.info("Reserved inventory for item {}: quantity={}, available={}, reserved={}",
					itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());
			}

			return true;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("MultiLock acquisition interrupted", e);
			return false;
		} catch (Exception e) {
			log.error("Error during batch reservation with MultiLock", e);
			return false;
		} finally {
			// 락 해제 (획득한 경우에만)
			if (isLocked) {
				multiLock.unlock();
			}
		}
	}

	// 전체 예약 취소 - Multi Lock
	@Override
	public boolean cancelReservations(Map<Integer, Integer> itemQuantities) {
		if (itemQuantities == null || itemQuantities.isEmpty()) {
			return true;
		}

		log.info("Starting batch reservation cancellation with MultiLock for {} items", itemQuantities.size());

		// MultiLock 생성
		RLock[] locks = new RLock[itemQuantities.size()];
		Integer[] itemIds = itemQuantities.keySet().toArray(new Integer[0]);

		int i = 0;
		for (Integer itemId : itemIds) {
			String lockKey = INVENTORY_LOCK_PREFIX + itemId;
			locks[i++] = redissonClient.getLock(lockKey);
		}

		RedissonMultiLock multiLock = new RedissonMultiLock(locks);
		boolean isLocked = false;

		try {
			// MultiLock으로 모든 락을 원자적으로 획득 시도
			isLocked = multiLock.tryLock(LOCK_WAIT_TIME, LOCK_LEASE_TIME, TimeUnit.SECONDS);

			if (!isLocked) {
				log.error("Failed to acquire MultiLock for items: {}", itemQuantities.keySet());
				return false;
			}

			// 모든 아이템 재고 조회
			Map<Integer, InventoryDto> inventories = getInventories(new ArrayList<>(itemQuantities.keySet()));

			// 모든 상품 재고 예약 취소
			for (Map.Entry<Integer, Integer> entry : itemQuantities.entrySet()) {
				Integer itemId = entry.getKey();
				Integer quantity = entry.getValue();
				InventoryDto inventory = inventories.get(itemId);

				if (inventory == null) {
					log.warn("Inventory not found for item {} during cancellation", itemId);
					continue; // 취소는 최대한 진행
				}

				// 예약된 재고 취소
				inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - quantity));
				inventory.setAvailableQuantity(inventory.getQuantity() - inventory.getReservedQuantity());

				String key = INVENTORY_KEY_PREFIX + itemId;
				redisTemplate.opsForValue().set(key, inventory);

				log.info("Canceled reservation for item {}: quantity={}, available={}, reserved={}",
					itemId, inventory.getQuantity(), inventory.getAvailableQuantity(), inventory.getReservedQuantity());
			}

			return true;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("MultiLock acquisition interrupted", e);
			return false;
		} catch (Exception e) {
			log.error("Error during batch cancellation with MultiLock", e);
			return false;
		} finally {
			// 락 해제 (획득한 경우에만)
			if (isLocked) {
				multiLock.unlock();
			}
		}
	}

	@Override
	public boolean hasStock(Integer itemId, Integer quantity) {
		try {
			InventoryDto inventory = getInventory(itemId);
			return inventory.getAvailableQuantity() >= quantity;
		} catch (Exception e) {
			log.error("Error checking stock for item {}", itemId, e);
			return false;
		}
	}
}
