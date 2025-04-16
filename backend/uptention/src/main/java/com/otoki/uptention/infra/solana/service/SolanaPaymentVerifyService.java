package com.otoki.uptention.infra.solana.service;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * 주문 결제 처리 및 결제 이벤트를 관리하는 서비스 인터페이스
 */
public interface SolanaPaymentVerifyService {

	/**
	 * 주문을 처리합니다.
	 *
	 * @param orderId 주문 ID (ORDER_ 접두사 제외)
	 * @param blockTime 블록 타임스탬프
	 * @param result 트랜잭션 결과 데이터
	 * @param signature 트랜잭션 서명
	 */
	void processOrder(String orderId, long blockTime, JsonNode result, String signature);
}