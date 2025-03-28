package com.otoki.uptention.domain.mining.service;

import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.user.entity.User;

public interface MiningTimeService {

	void saveMiningTime(MiningTime miningTime);
	MiningTime findMiningTime(User user);
}
