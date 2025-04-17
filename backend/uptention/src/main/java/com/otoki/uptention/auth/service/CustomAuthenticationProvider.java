package com.otoki.uptention.auth.service;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationProvider implements AuthenticationProvider {

	private final UserDetailsService userDetailsService;
	private final PasswordEncoder passwordEncoder;

	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		CustomAuthenticationToken token = (CustomAuthenticationToken)authentication;
		String username = token.getPrincipal().toString();
		String password = token.getCredentials().toString();
		String loginType = token.getLoginType();

		UserDetails userDetails = userDetailsService.loadUserByUsername(username);

		// 비밀번호 검증 로직 (PasswordEncoder를 사용하여 비교)
		if (!passwordEncoder.matches(password, userDetails.getPassword())) {
			throw new BadCredentialsException(ErrorCode.AUTH_FAILED_LOGIN.getDefaultMessage());
		}

		// loginType에 따른 권한 검증
		boolean validRole = false;
		if ("member".equals(loginType)) {
			validRole = userDetails.getAuthorities().stream().anyMatch(
				auth -> auth.getAuthority().equals("ROLE_MEMBER") || auth.getAuthority().equals("ROLE_TEMP_MEMBER")
			);
		} else if ("admin".equals(loginType)) {
			validRole = userDetails.getAuthorities().stream().anyMatch(
				auth -> auth.getAuthority().equals("ROLE_ADMIN")
			);
		}

		if (!validRole) {
			throw new BadCredentialsException(ErrorCode.AUTH_FAILED_LOGIN.getDefaultMessage());
		}

		return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
	}

	@Override
	public boolean supports(Class<?> authentication) {
		return CustomAuthenticationToken.class.isAssignableFrom(authentication);
	}
}

