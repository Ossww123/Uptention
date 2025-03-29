package com.otoki.uptention.auth.service;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

public class CustomAuthenticationToken extends UsernamePasswordAuthenticationToken {
	private String loginType;

	public CustomAuthenticationToken(Object principal, Object credentials, String loginType) {
		super(principal, credentials);
		this.loginType = loginType;
	}

	public String getLoginType() {
		return loginType;
	}
}
