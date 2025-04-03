package com.otoki.uptention.global.config;

import java.time.Duration;

import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.integration.redis.util.RedisLockRegistry;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class RedisConfig {

	private final RedisProperties redisProperties;

	@Bean
	public RedisConnectionFactory redisConnectionFactory() {
		// Redis 서버 설정
		RedisStandaloneConfiguration redisStandaloneConfiguration = new RedisStandaloneConfiguration();
		redisStandaloneConfiguration.setHostName(redisProperties.getHost());
		redisStandaloneConfiguration.setPort(redisProperties.getPort());

		// Lettuce 풀 설정
		LettucePoolingClientConfiguration poolingClientConfig = LettucePoolingClientConfiguration.builder()
			.commandTimeout(Duration.ofMillis(redisProperties.getTimeout()))
			.poolConfig(poolConfig())
			.build();

		return new LettuceConnectionFactory(redisStandaloneConfiguration, poolingClientConfig);
	}

	@Bean
	public GenericObjectPoolConfig<?> poolConfig() {
		GenericObjectPoolConfig<?> config = new GenericObjectPoolConfig<>();
		config.setMaxTotal(redisProperties.getLettuce().getPool().getMaxActive());
		config.setMaxIdle(redisProperties.getLettuce().getPool().getMaxIdle());
		config.setMinIdle(redisProperties.getLettuce().getPool().getMinIdle());
		config.setMaxWait(Duration.ofMillis(redisProperties.getLettuce().getPool().getMaxWait()));
		return config;
	}

	@Bean
	public RedisTemplate<String, Object> redisTemplate() {
		RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
		redisTemplate.setConnectionFactory(redisConnectionFactory());
		redisTemplate.setKeySerializer(new StringRedisSerializer());
		redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
		return redisTemplate;
	}

	@Bean
	public RedisLockRegistry redisLockRegistry(RedisConnectionFactory redisConnectionFactory) {
		return new RedisLockRegistry(redisConnectionFactory, "item-inventory-locks", 30000);
	}
}