package com.otoki.uptention.global.lock;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DistributedLockManager {

	private final RedissonClient redissonClient;

	/**
	 * 분산 락을 사용하여 작업을 실행합니다.
	 * @param lockName 락 이름 (고유해야 함)
	 * @param waitTimeSeconds 락 획득 대기 시간 (초)
	 * @param leaseTimeSeconds 락 유지 최대 시간 (초)
	 * @param supplier 실행할 작업
	 * @param <T> 반환 타입
	 * @return 작업 결과
	 */
	public <T> T executeWithLock(String lockName, int waitTimeSeconds, int leaseTimeSeconds, Supplier<T> supplier) {
		RLock lock = redissonClient.getLock(lockName);
		boolean acquired = false;

		try {
			acquired = lock.tryLock(waitTimeSeconds, leaseTimeSeconds, TimeUnit.SECONDS);

			if (acquired) {
				log.debug("락 획득 성공: {}", lockName);
				return supplier.get();
			} else {
				log.info("락 획득 실패 (다른 인스턴스에서 이미 실행 중): {}", lockName);
				return null;
			}

		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("락 획득 중 인터럽트 발생: {}", lockName, e);
			return null;
		} catch (Exception e) {
			log.error("락 실행 중 예외 발생: {}", lockName, e);
			throw e;
		} finally {
			if (acquired && lock.isHeldByCurrentThread()) {
				lock.unlock();
				log.debug("락 해제: {}", lockName);
			}
		}
	}

	/**
	 * 반환값이 없는 작업을 위한 오버로딩 메서드
	 */
	public void executeWithLock(String lockName, int waitTimeSeconds, int leaseTimeSeconds, Runnable runnable) {
		executeWithLock(lockName, waitTimeSeconds, leaseTimeSeconds, () -> {
			runnable.run();
			return null;
		});
	}
}
