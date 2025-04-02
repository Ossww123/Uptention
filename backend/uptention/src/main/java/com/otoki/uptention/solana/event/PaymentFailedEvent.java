package com.otoki.uptention.solana.event;

import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 실패 이벤트
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedEvent implements Serializable {

	private static final long serialVersionUID = 1L;

	/**
	 * 주문 ID
	 */
	private Integer orderId;

	/**
	 * 사용자 ID
	 */
	private Integer userId;

	/**
	 * 실패 시간 (밀리초 단위의 타임스탬프)
	 */
	private Long failedAt;

	/**
	 * 실패 사유
	 */
	private String reason;

	/**
	 * 트랜잭션 서명 (있는 경우)
	 */
	private String transactionSignature;
}