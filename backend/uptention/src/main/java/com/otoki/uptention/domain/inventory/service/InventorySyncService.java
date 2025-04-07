package com.otoki.uptention.domain.inventory.service;

public interface InventorySyncService {
	void initializeAllInventories();

	void syncAllInventoriesToDatabase();
}
