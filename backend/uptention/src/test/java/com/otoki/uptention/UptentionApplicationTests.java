package com.otoki.uptention;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(classes = UptentionApplication.class) // main 애플리케이션 클래스 지정
@ActiveProfiles("test") // 테스트 프로파일 적용
@TestPropertySource(properties = {
	"spring.datasource.url=jdbc:h2:mem:testdb",
	"spring.datasource.driver-class-name=org.h2.Driver",
	"spring.datasource.username=sa",
	"spring.datasource.password=",
	"spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
	"spring.jpa.hibernate.ddl-auto=create-drop",
	"spring.jpa.show-sql=true"
})
class UptentionApplicationTests {

	@Test
	void contextLoads() {
	}
}
