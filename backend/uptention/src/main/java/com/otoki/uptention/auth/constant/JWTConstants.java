package com.otoki.uptention.auth.constant;

public class JWTConstants {
	public static final String ACCESS_TOKEN = "Authorization";
	public static final String PREFIX_JWT = "Bearer ";
	public static final long ACCESS_TOKEN_EXPIRATION_TIME_MS = 30 * 24 * 60 * 60 * 1000L; // 30 days
}
