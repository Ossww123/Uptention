package com.otoki.uptention.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
			.allowedOrigins("https://j12d211.p.ssafy.io", "http://localhost:3000")
			// .exposedHeaders("Set-Cookie")
			.allowCredentials(true)
			.allowedHeaders("Authorization", "Content-Type")
			.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS") // 허용할 HTTP 메서드
			.maxAge(3600);
	}
}

