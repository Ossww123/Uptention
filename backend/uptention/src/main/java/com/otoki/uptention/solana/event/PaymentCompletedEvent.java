package com.otoki.uptention.solana.event;

import java.io.Serializable;
import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 완료 이벤트
 * RabbitMQ를 통해 다른 마이크로서비스에 결제 완료를 알리는 이벤트 클래스
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent implements Serializable {

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
	 * 결제 총액
	 */
	private BigDecimal totalAmount;

	/**
	 * 결제 완료 시간 (밀리초 단위의 타임스탬프)
	 */
	private Long completedAt;

	/**
	 * 트랜잭션 서명 (Solana 트랜잭션 ID)
	 */
	private String transactionSignature;
}
