package com.otoki.uptention.solana.service;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Solana 트랜잭션 정보를 처리하고 관리하는 서비스 인터페이스
 */
public interface SolanaTransactionService {

	/**
	 * 트랜잭션이 이미 처리되었는지 확인합니다.
	 *
	 * @param signature 트랜잭션 서명
	 * @return 이미 처리된 트랜잭션인지 여부
	 */
	boolean isProcessedSignature(String signature);

	/**
	 * 트랜잭션 서명을 처리된 목록에 추가합니다.
	 *
	 * @param signature 트랜잭션 서명
	 */
	void addProcessedSignature(String signature);

	/**
	 * WebSocket에서 받은 로그로 트랜잭션을 처리합니다.
	 *
	 * @param signature 트랜잭션 서명
	 * @param logs 트랜잭션 로그 메시지 목록
	 */
	void processTransactionWithLogs(String signature, List<String> logs);

	/**
	 * 트랜잭션 서명으로 트랜잭션을 조회하고 처리합니다.
	 *
	 * @param signature 트랜잭션 서명
	 */
	void processTransactionBySignature(String signature);

	/**
	 * Solana RPC를 통해 트랜잭션 세부 정보를 조회합니다.
	 *
	 * @param signature 트랜잭션 서명
	 * @return 트랜잭션 데이터 JSON 노드
	 */
	JsonNode fetchTransactionDetails(String signature);

	/**
	 * 로그 메시지에서 주문 ID를 찾습니다.
	 *
	 * @param logs 로그 메시지 목록
	 * @return 추출된 주문 ID (없으면 null)
	 */
	String findOrderIdFromLogs(List<String> logs);

	/**
	 * 지나치게 오래된 처리 완료된 트랜잭션 서명을 정리합니다.
	 * 메모리 관리를 위해 주기적으로 호출됩니다.
	 */
	void cleanupProcessedSignatures();
}