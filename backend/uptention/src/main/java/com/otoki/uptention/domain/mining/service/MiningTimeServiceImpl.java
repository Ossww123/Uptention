package com.otoki.uptention.domain.mining.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.mining.repository.MiningTimeRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MiningTimeServiceImpl implements MiningTimeService {

	private final MiningTimeRepository miningTimeRepository;

	@Override
	public void saveMiningTime(MiningTime miningTime) {
		// 채굴시간 저장
		miningTimeRepository.save(miningTime);
	}
}
