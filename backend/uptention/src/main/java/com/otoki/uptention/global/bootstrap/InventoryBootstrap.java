package com.otoki.uptention.global.bootstrap;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import com.otoki.uptention.global.lock.DistributedLockManager;
import com.otoki.uptention.global.scheduler.InventoryScheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryBootstrap implements ApplicationListener<ApplicationReadyEvent> {
	private static final String INVENTORY_INIT_LOCK = "bootstrap:inventory:init";

	private final InventoryScheduler inventoryScheduler;
	private final DistributedLockManager lockManager;

	@Override
	public void onApplicationEvent(ApplicationReadyEvent event) {
		log.info("Application ready, attempting to initialize inventory");

		lockManager.executeWithLock(INVENTORY_INIT_LOCK, 30, 300, () -> {
			log.info("Starting inventory initialization on application startup");
			inventoryScheduler.initializeAllInventories();
			log.info("Inventory initialization completed");
		});
	}
}
