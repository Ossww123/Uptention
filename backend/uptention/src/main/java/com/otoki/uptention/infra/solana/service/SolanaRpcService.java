package com.otoki.uptention.infra.solana.service;

import java.io.IOException;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Solana RPC 서비스 인터페이스
 * Solana 블록체인과의 통신을 담당하는 서비스
 */
public interface SolanaRpcService {

	/**
	 * 트랜잭션 세부 정보 조회
	 *
	 * @param signature 트랜잭션 서명
	 * @return 트랜잭션 정보를 담은 JsonNode
	 * @throws IOException RPC 통신 오류 발생 시
	 */
	JsonNode getTransaction(String signature) throws IOException;

	/**
	 * 회사 지갑의 최근 트랜잭션 서명 목록 조회
	 *
	 * @param limit 조회할 트랜잭션 수
	 * @return 트랜잭션 서명 목록
	 * @throws IOException RPC 통신 오류 발생 시
	 */
	List<String> getRecentTransactions(int limit) throws IOException;

	/**
	 * 지갑 잔액 조회
	 *
	 * @param address 지갑 주소
	 * @return lamports 단위의 잔액
	 * @throws IOException RPC 통신 오류 발생 시
	 */
	long getBalance(String address) throws IOException;

	/**
	 * 회사 지갑 잔액 조회
	 *
	 * @return lamports 단위의 잔액
	 * @throws IOException RPC 통신 오류 발생 시
	 */
	long getCompanyWalletBalance() throws IOException;

	/**
	 * 특정 소유자의 토큰 계정 조회
	 *
	 * @param owner 소유자 지갑 주소
	 * @param filter 필터 (예: 특정 민트로 필터링)
	 * @param options 추가 옵션
	 * @return 토큰 계정 정보
	 * @throws IOException RPC 통신 오류 발생 시
	 */
	JsonNode getTokenAccountsByOwner(String owner, Object filter, Object options) throws IOException;

	/**
	 * WebSocket 구독 메시지 생성
	 *
	 * @return 회사 지갑 주소에 대한 WebSocket 구독 메시지
	 * @throws IOException JSON 생성 오류 발생 시
	 */
	String createAccountSubscribeMessage() throws IOException;
}
