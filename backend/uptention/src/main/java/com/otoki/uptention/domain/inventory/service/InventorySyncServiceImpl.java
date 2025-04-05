package com.otoki.uptention.domain.inventory.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.inventory.dto.InventoryDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventorySyncServiceImpl implements InventorySyncService {
	private final InventoryService inventoryService;
	private final ItemService itemService;

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

	@Transactional
	@Scheduled(fixedDelay = 300000)
	@Override
	public void syncAllInventoriesToDatabase() {
		log.info("Starting synchronization of all inventories to database");

		List<Item> allItems = itemService.getAllItems();
		for (Item item : allItems) {
			try {
				InventoryDto inventory = inventoryService.getInventory(item.getId());
				item.updateQuantity(inventory.getQuantity());

				log.info("Synchronized inventory for item {} to database: quantity={}", item.getId(),
					inventory.getQuantity());
			} catch (Exception e) {
				log.error("Error synchronizing inventory for item {}", item.getId(), e);
			}
		}

		log.info("Completed synchronization of all inventories to database");
	}
}
