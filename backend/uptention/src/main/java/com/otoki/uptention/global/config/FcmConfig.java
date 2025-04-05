package com.otoki.uptention.global.config;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

@Configuration
public class FcmConfig {
	@Bean
	public FirebaseMessaging firebaseMessaging() throws IOException {
		// 기본 FirebaseApp이 이미 초기화되어 있다면, 해당 인스턴스의 FirebaseMessaging을 반환 (early return)
		if (!FirebaseApp.getApps().isEmpty()) {
			return FirebaseMessaging.getInstance(FirebaseApp.getInstance());
		}

		// try-with-resources를 사용해 InputStream을 자동으로 닫음
		ClassPathResource resource = new ClassPathResource("firebase/serviceAccountKey.json");

		// InputStream을 자동으로 닫기 위한 try-with-resources 사용
		try (InputStream serviceAccount = resource.getInputStream()) {
			// 서비스 계정 키를 기반으로 FirebaseOptions 생성
			FirebaseOptions options = FirebaseOptions.builder()
				.setCredentials(GoogleCredentials.fromStream(serviceAccount))
				.build();

			// FirebaseApp 초기화
			FirebaseApp firebaseApp = FirebaseApp.initializeApp(options);

			// 초기화된 FirebaseApp 인스턴스를 사용하여 FirebaseMessaging 반환
			return FirebaseMessaging.getInstance(firebaseApp);
		}
	}
}
