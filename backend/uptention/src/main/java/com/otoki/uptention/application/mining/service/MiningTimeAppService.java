package com.otoki.uptention.application.mining.service;


public interface MiningTimeAppService {

	void focusModeOn(Integer userId);
	void focusModeOff(Integer userId);
	int bulkUpdateMiningTime();
}
