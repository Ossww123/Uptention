package com.otoki.uptention.global.scheduler;

public interface InventoryScheduler {
	void initializeAllInventories();

	void syncAllInventoriesToDatabase();
}
