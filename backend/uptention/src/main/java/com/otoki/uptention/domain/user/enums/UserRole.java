package com.otoki.uptention.domain.user.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserRole {
	ROLE_ADMIN("ROLE_ADMIN", "관리자"),
	ROLE_MEMBER("ROLE_MEMBER", "정회원"),
	ROLE_TEMP_MEMBER("ROLE_TEMP_MEMBER", "임시회원");

	private final String value; // DB에 저장될 값
	private final String title; // 사용자 친화적인 이름

	@Override
	public String toString() {
		return this.value;
	}
}
