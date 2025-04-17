package com.otoki.uptention.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@OpenAPIDefinition(
	info = @Info(title = "업텐션 명세서",
		description = "업텐션 백엔드 API",
		version = "1.0"),
	servers = {
		@Server(url = "http://localhost:8080", description = "개발 서버"),
		@Server(url = "https://j12d211.p.ssafy.io", description = "운영 서버")
	}
)
@Configuration
public class SwaggerConfig {
	private static final String BEARER_TOKEN_PREFIX = "Bearer";

	@Bean
	public OpenAPI openAPI() {
		String accessToken = "Access Token (Bearer)";

		SecurityRequirement securityRequirement = new SecurityRequirement()
			.addList(accessToken);

		SecurityScheme accessTokenSecurityScheme = new SecurityScheme()
			.type(SecurityScheme.Type.HTTP)
			.scheme(BEARER_TOKEN_PREFIX)
			.bearerFormat("JWT")
			.in(SecurityScheme.In.HEADER)
			.name(HttpHeaders.AUTHORIZATION);

		Components components = new Components()
			.addSecuritySchemes(accessToken, accessTokenSecurityScheme);

		return new OpenAPI()
			.addSecurityItem(securityRequirement)
			.components(components);
	}
}
