package com.otoki.uptention.domain.order.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OrderHistoryType {
	PURCHASE("PURCHASE", "일반구매"),
	GIFT("GIFT", "선물구매");

	private final String value; // DB에 저장될 값
	private final String description;

	@Override
	public String toString() {
		return this.value;
	}
}
