package com.otoki.uptention.auth.util;

import java.util.Date;
import java.util.HexFormat;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.otoki.uptention.auth.constant.JWTConstants;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;

@Component
public class JWTUtil {
	public static final String USER_ID_CLAIM = "userId";
	public static final String ROLE_CLAIM = "role";
	public static final String CATEGORY_CLAIM = "category";
	private final SecretKey secretKey;

	public JWTUtil(@Value("${spring.jwt.secret}") String secretKey) {
		byte[] secretBytes = HexFormat.of().parseHex(secretKey);
		this.secretKey = new SecretKeySpec(secretBytes, "HmacSHA256");
	}

	public Integer getUserId(String token) {
		return Jwts.parser()
			.verifyWith(secretKey)
			.build()
			.parseSignedClaims(token)
			.getPayload()
			.get(USER_ID_CLAIM, Integer.class);
	}

	public String getRole(String token) {
		return Jwts.parser()
			.verifyWith(secretKey)
			.build()
			.parseSignedClaims(token)
			.getPayload()
			.get(ROLE_CLAIM, String.class);
	}

	public String getCategory(String token) {
		return Jwts.parser()
			.verifyWith(secretKey)
			.build()
			.parseSignedClaims(token)
			.getPayload()
			.get(CATEGORY_CLAIM, String.class);
	}

	public void validateAccessToken(String accessToken) {
		String category;

		try {
			category = getCategory(accessToken);
		} catch (ExpiredJwtException e) {
			throw new CustomException(ErrorCode.EXPIRED_ACCESS_TOKEN);
		}

		if (!category.equals(JWTConstants.ACCESS_TOKEN)) {
			throw new CustomException(ErrorCode.EXPIRED_ACCESS_TOKEN);
		}
	}

	public String createJwt(String category, Integer userId, String role, Long expiredMs) {
		return Jwts.builder()
			.claim(CATEGORY_CLAIM, category)
			.claim(USER_ID_CLAIM, userId)
			.claim(ROLE_CLAIM, role)
			.issuedAt(new Date(System.currentTimeMillis()))
			.expiration(new Date(System.currentTimeMillis() + expiredMs))
			.signWith(secretKey)
			.compact();
	}
}
