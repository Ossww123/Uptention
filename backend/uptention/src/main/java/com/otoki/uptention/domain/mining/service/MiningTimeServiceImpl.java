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
		try {
			// 채굴시간 저장
			miningTimeRepository.save(miningTime);
		} catch (Exception e) {
			// 저장 실패 시 커스텀 오류 생성
			throw new CustomException(ErrorCode.FOCUS_MODE_ON_FAILED);
		}
	}
}
