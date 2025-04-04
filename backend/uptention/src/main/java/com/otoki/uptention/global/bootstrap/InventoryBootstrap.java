package com.otoki.uptention.global.bootstrap;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import com.otoki.uptention.domain.inventory.service.InventorySyncService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryBootstrap implements ApplicationListener<ApplicationReadyEvent> {

	private final InventorySyncService inventorySyncService;

	@Override
	public void onApplicationEvent(ApplicationReadyEvent event) {
		log.info("Starting inventory initialization on application startup");
		inventorySyncService.initializeAllInventories();
		log.info("Inventory initialization completed");
	}
}