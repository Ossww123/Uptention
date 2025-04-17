package com.otoki.uptention.application.payment.service;

/**
 * 결제 처리를 담당하는 서비스 인터페이스
 */
public interface PaymentProcessService {

	/**
	 * 결제 완료 처리
	 *
	 * @param orderId 주문 ID
	 * @return 처리 결과 (성공/실패)
	 */
	boolean processPaymentSuccess(String orderId);

	/**
	 * 결제 실패 처리
	 *
	 * @param orderId 주문 ID
	 * @param reason  실패 사유
	 * @return 처리 결과 (성공/실패)
	 */
	boolean processPaymentFailure(String orderId, String reason);
}
