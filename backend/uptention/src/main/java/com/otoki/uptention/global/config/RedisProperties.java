package com.otoki.uptention.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@ConfigurationProperties(prefix = "spring.redis")
@RequiredArgsConstructor
@Getter
public class RedisProperties {

	private final String host;
	private final int port;
	private final int timeout;
	private final Lettuce lettuce;

	@Getter
	@RequiredArgsConstructor
	public static class Lettuce {
		private final Pool pool;

		@Getter
		@RequiredArgsConstructor
		public static class Pool {
			private final int maxActive;
			private final int maxIdle;
			private final int minIdle;
			private final int maxWait;
		}
	}
}
