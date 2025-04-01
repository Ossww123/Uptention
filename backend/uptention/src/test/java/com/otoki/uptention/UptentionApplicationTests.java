package com.otoki.uptention;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = UptentionApplication.class) // main 애플리케이션 클래스 지정
@ActiveProfiles("test")
class UptentionApplicationTests {

	@Test
	void contextLoads() {
	}
}
