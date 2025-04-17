package com.otoki.uptention.global.scheduler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.item.dto.InventoryDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.InventoryService;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.global.lock.DistributedLockManager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventorySchedulerImpl implements InventoryScheduler {
	private static final String INVENTORY_SYNC_LOCK = "scheduler:inventory:sync";

	private final InventoryService inventoryService;
	private final ItemService itemService;
	private final DistributedLockManager lockManager;

	@Override
	public void initializeAllInventories() {
		log.info("Initializing all inventories from database to Redis");
		List<Item> allItems = itemService.getAllItems();

		Map<Integer, Integer> itemQuantities = new HashMap<>();
		for (Item item : allItems) {
			itemQuantities.put(item.getId(), item.getQuantity());
		}

		inventoryService.initializeInventories(itemQuantities);
	}

	@Scheduled(fixedDelay = 300000)
	@Override
	public void syncAllInventoriesToDatabase() {
		lockManager.executeWithLock(INVENTORY_SYNC_LOCK, 10, 240, () -> {
			log.info("Starting synchronization of all inventories to database");

			List<Item> allItems = itemService.getAllItems();
			for (Item item : allItems) {
				try {
					InventoryDto inventory = inventoryService.getInventory(item.getId());
					item.updateQuantity(inventory.getQuantity());

					// log.info("Synchronized inventory for item {} to database: quantity={}", item.getId(),
					// 	inventory.getQuantity());
				} catch (Exception e) {
					log.error("Error synchronizing inventory for item {}", item.getId(), e);
				}
			}

			log.info("Completed synchronization of all inventories to database");
		});
	}
}
