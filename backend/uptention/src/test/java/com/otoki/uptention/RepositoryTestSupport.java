package com.otoki.uptention;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * JPA Repository 테스트용 기본 지원 클래스.
 *
 * - {@link DataJpaTest} 적용: JPA 관련 테스트만 수행하도록 설정.
 * - {@link ActiveProfiles}("test") 적용: 테스트 환경에서는 "test" 프로필 사용.
 * - {@link AutoConfigureTestDatabase}(replace = NONE): 내장 DB 대신 별도 테스트 DB 사용.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public abstract class RepositoryTestSupport {
}
