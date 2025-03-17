package com.otoki.uptention.global.config;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
	info = @Info(title = "업텐션 명세서",
		description = "업텐션 백엔드 API",
		version = "1.0"),
	servers = {
		@Server(url = "http://localhost:8080", description = "개발 서버"),
	}
)
@Configuration
public class SwaggerConfig {

}
