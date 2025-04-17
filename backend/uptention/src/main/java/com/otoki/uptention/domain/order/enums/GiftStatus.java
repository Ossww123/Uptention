package com.otoki.uptention.domain.order.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GiftStatus {
	PENDING("PENDING", "수령 대기"),
	RECEIVED("RECEIVED", "수령 완료");

	private final String value; // DB에 저장될 값
	private final String description;

	@Override
	public String toString() {
		return this.value;
	}
}
