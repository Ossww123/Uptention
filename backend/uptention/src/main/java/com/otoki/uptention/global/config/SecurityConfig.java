package com.otoki.uptention.global.config;

import java.util.Arrays;
import java.util.Collections;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;

import com.otoki.uptention.auth.filter.CustomLogoutFilter;
import com.otoki.uptention.auth.filter.JWTFilter;
import com.otoki.uptention.auth.filter.LoginFilter;
import com.otoki.uptention.auth.service.AccessTokenService;
import com.otoki.uptention.domain.user.service.FcmTokenService;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.FilterExceptionHandler;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
	private final JWTFilter jwtFilter;
	private final AccessTokenService accessTokenService;
	private final FcmTokenService fcmTokenService;
	private final UserService userService;
	private final CustomLogoutFilter customLogoutFilter;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws
		Exception {
		return authenticationConfiguration.getAuthenticationManager();
	}

	@Bean
	public LoginFilter loginFilter(AuthenticationManager authenticationManager) {
		LoginFilter loginFilter = new LoginFilter(authenticationManager, accessTokenService, fcmTokenService,
			userService);
		loginFilter.setFilterProcessesUrl("/api/login");
		return loginFilter;
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http, LoginFilter loginFilter) throws Exception {
		// Cors 설정
		http
			.cors((corsCustomizer -> corsCustomizer.configurationSource(request -> {

				CorsConfiguration configuration = new CorsConfiguration();

				configuration.setAllowedOrigins(
					Arrays.asList("https://j12d211.p.ssafy.io", "http://localhost:3000"));
				configuration.setAllowedMethods(Collections.singletonList("*"));
				configuration.setAllowCredentials(true);
				configuration.setAllowedHeaders(Collections.singletonList("*"));
				configuration.setMaxAge(3600L);

				// 클라이언트에서 읽을 수 있도록 응답 헤더에 Authorization과 FCM-Token 추가
				configuration.setExposedHeaders(Arrays.asList("Authorization", "FCM-Token"));

				return configuration;
			})));

		// 권한 설정
		http
			.authorizeHttpRequests(auth -> auth
				.anyRequest().permitAll());

		//JWTFilter 등록
		http
			.addFilterBefore(jwtFilter, LoginFilter.class);

		// loginFilter 등록
		http
			.addFilterAt(loginFilter, UsernamePasswordAuthenticationFilter.class);

		http
			.addFilterBefore(new FilterExceptionHandler(), LogoutFilter.class);
		
		http
			.addFilterAfter(customLogoutFilter, LogoutFilter.class);

		// 기본 logout 비활성화
		http
			.logout(AbstractHttpConfigurer::disable);

		// csrf 토큰 사용 x
		http
			.csrf(AbstractHttpConfigurer::disable);

		// formLogin 비활성화: 기본 form 기반 로그인 기능을 사용하지 않도록 설정
		http
			.formLogin(AbstractHttpConfigurer::disable);

		// httpBasic 비활성화: HTTP 기본 인증 방식을 사용하지 않도록 설정
		http
			.httpBasic(AbstractHttpConfigurer::disable);

		// 세션 관리 설정: 상태를 저장하지 않는(STATELESS) 방식으로 세션 생성 정책을 지정하여 서버에서 세션을 생성 또는 유지하지 않도록 설정
		http
			.sessionManagement((session) -> session
				.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

		return http.build();
	}
}
