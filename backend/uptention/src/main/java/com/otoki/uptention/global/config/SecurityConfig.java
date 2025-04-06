package com.otoki.uptention.global.config;

import java.util.Arrays;
import java.util.Collections;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
				// 상품 목록 조회 (ROLE_ADMIN, ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/items").hasAnyRole("ADMIN", "MEMBER")
				// 상품 등록 (ROLE_ADMIN)
				.requestMatchers(HttpMethod.POST, "/api/items").hasRole("ADMIN")
				// 상품 상세 조회 (ROLE_ADMIN, ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/items/{itemId}").hasAnyRole("ADMIN", "MEMBER")
				// 상품 삭제 (ROLE_ADMIN)
				.requestMatchers(HttpMethod.DELETE, "/api/items/{itemId}").hasRole("ADMIN")
				// 상품 수정 (ROLE_ADMIN)
				.requestMatchers(HttpMethod.PATCH, "/api/items/{itemId}").hasRole("ADMIN")

				// 배송 정보 등록 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.POST, "/api/orders/{orderId}/delivery-info").hasRole("MEMBER")
				// 상품 검증 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.POST, "/api/orders/verify").hasRole("MEMBER")
				// 상품 주문 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.POST, "/api/orders/purchase").hasRole("MEMBER")
				// 상품 선물 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.POST, "/api/orders/gift").hasRole("MEMBER")
				// 주문 내역 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/orders").hasRole("MEMBER")
				// 주문 상세 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/orders/{orderId}/order-items/{orderItemId}").hasRole("MEMBER")
				// 최근 배송지 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/orders/delivery-info").hasRole("MEMBER")

				// 전체 카테고리 목록 조회 (ROLE_ADMIN, ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/category").hasAnyRole("ADMIN", "MEMBER")

				// 모든 알림 읽음 처리 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.PATCH, "/api/notifications/read").hasRole("MEMBER")
				// 알림 목록 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/notifications").hasRole("MEMBER")
				// 읽지 않은 알림 개수 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/notifications/count").hasRole("MEMBER")

				// 프로필 이미지 업로드 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.PUT, "/api/users/{userId}/profiles").hasRole("MEMBER")
				// 프로필 이미지 삭제 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.DELETE, "/api/users/{userId}/profiles").hasRole("MEMBER")
				// 지갑 연결 (ROLE_TEMP_MEMBER, ROLE_MEMBER)
				.requestMatchers(HttpMethod.POST, "/api/users/{userId}/wallet").hasAnyRole("TEMP_MEMBER", "MEMBER")
				// 유저 정보 페이징 조회 (ROLE_ADMIN, ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/users").hasAnyRole("ADMIN", "MEMBER")
				// 유저 정보 조회 (ROLE_ADMIN, ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/users/{userId}").hasAnyRole("ADMIN", "MEMBER")
				// 유저 삭제 (ROLE_ADMIN)
				.requestMatchers(HttpMethod.DELETE, "/api/users/{userId}").hasRole("ADMIN")
				// 포인트 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/users/{userId}/point").hasRole("MEMBER")
				// 집중 모드 시간 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/users/{userId}/mining-times").hasRole("MEMBER")

				// 인증, 인가 관련 API
				// 로그인 (모든 사용자 접근 가능)
				.requestMatchers(HttpMethod.POST, "/api/login").permitAll()
				// 회원가입 (ROLE_ADMIN)
				.requestMatchers(HttpMethod.POST, "/api/join").hasRole("ADMIN")
				// 비밀번호 변경 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.PATCH, "/api/users/{userId}/password").hasRole("MEMBER")
				// 아이디 중복 검사 (ROLE_ADMIN)
				.requestMatchers(HttpMethod.GET, "/api/join/check-username").hasRole("ADMIN")
				// 사번 중복 검사 (ROLE_ADMIN)
				.requestMatchers(HttpMethod.GET, "/api/join/check-employee-number").hasRole("ADMIN")

				// 장바구니 API
				// 장바구니 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/shopping-cart").hasRole("MEMBER")
				// 장바구니 담기 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.POST, "/api/shopping-cart").hasRole("MEMBER")
				// 장바구니 상품 삭제 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.DELETE, "/api/shopping-cart").hasRole("MEMBER")
				// 장바구니 상품 수량 수정 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.PATCH, "/api/shopping-cart/{cartId}/quantity").hasRole("MEMBER")
				// 장바구니 상품 개수 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/shopping-cart/count").hasRole("MEMBER")

				// 집중 모드 API
				// 집중 모드 시작 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.POST, "/api/mining-time/focus").hasRole("MEMBER")
				// 집중 모드 종료 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.PATCH, "/api/mining-time/focus").hasRole("MEMBER")
				// 우수 사원 랭킹 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/mining-time").hasRole("MEMBER")

				// 선물함 API
				// 선물함 목록 조회 (ROLE_MEMBER)
				.requestMatchers(HttpMethod.GET, "/api/gifts").hasRole("MEMBER")

				// 나머지 요청
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
