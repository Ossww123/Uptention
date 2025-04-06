package com.otoki.uptention.global.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

	/**
	 * FCM 알림 전송을 위한 전용 스레드 풀 설정
	 */
	@Bean(name = "fcmTaskExecutor")
	public Executor fcmTaskExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

		// CPU 코어 수 확인
		int coreCount = Runtime.getRuntime().availableProcessors();

		// I/O 바운드 작업이므로 CPU 코어 수의 3배로 설정
		executor.setCorePoolSize(coreCount * 3);
		executor.setMaxPoolSize(coreCount * 5);
		executor.setQueueCapacity(100);
		executor.setThreadNamePrefix("fcm-async-");

		executor.initialize();
		return executor;
	}
}
