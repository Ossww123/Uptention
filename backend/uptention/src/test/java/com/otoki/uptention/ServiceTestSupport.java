package com.otoki.uptention;

import org.redisson.api.RedissonClient;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.otoki.uptention.global.lock.DistributedLockManager;
import com.otoki.uptention.infra.solana.service.SolanaRpcService;
import com.otoki.uptention.infra.solana.service.SolanaTransactionMonitorService;

/**
 * Application Service 레이어 테스트용 기본 지원 클래스.
 *
 * - {@link SpringBootTest} 적용: 애플리케이션 컨텍스트 로드하여 서비스 계층 테스트 가능.
 * - {@link ActiveProfiles}("test") 적용: 테스트 환경에서는 "test" 프로필 사용.
 * - MockBean은 개별 테스트 클래스에서 선언하여 사용해야 함.
 */
@ActiveProfiles("test")
@SpringBootTest
@ImportAutoConfiguration(exclude = {
	RedisAutoConfiguration.class,
	RedisRepositoriesAutoConfiguration.class
})
public abstract class ServiceTestSupport {

	@MockBean
	private SolanaTransactionMonitorService solanaTransactionMonitorService;

	@MockBean
	private SolanaRpcService solanaRpcService;

	@MockBean
	protected RedisTemplate<String, Object> redisTemplate;

	@MockBean
	protected RedissonClient redissonClient;

	@MockBean
	private RedisConnectionFactory redisConnectionFactory;

	@MockBean
	protected DistributedLockManager lockManager;
}
