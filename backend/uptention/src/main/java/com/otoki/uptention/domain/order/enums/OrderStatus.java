package com.otoki.uptention.domain.order.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OrderStatus {
	PAYMENT_PENDING("PAYMENT_PENDING", "결제 대기"),
	PAYMENT_COMPLETED("PAYMENT_COMPLETED", "결제 완료"),
	PAYMENT_FAILED("PAYMENT_FAILED", "결제 실패");

	private final String value; // DB에 저장될 값
	private final String description; // 사용자 친화적인 이름

	@Override
	public String toString() {
		return this.value;
	}
}