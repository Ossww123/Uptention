package com.otoki.uptention.domain.inventory.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.inventory.dto.InventoryDto;
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
			log.warn("Inventory not found in Redis for item {}", itemId);
			throw new CustomException(ErrorCode.ITEM_NOT_FOUND);
		}

		return (InventoryDto)result;
	}

	@Override
	public Map<Integer, InventoryDto> getInventories(List<Integer> itemIds) {
		Map<Integer, InventoryDto> result = new HashMap<>();
		for (Integer itemId : itemIds) {
			try {
				result.put(itemId, getInventory(itemId));
			} catch (Exception e) {
				log.error("Error getting inventory for item {}", itemId, e);
			}
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
			inventory.setQuantity(newQuantity);
			inventory.setAvailableQuantity(newQuantity - inventory.getReservedQuantity());

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
