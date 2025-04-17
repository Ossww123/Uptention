package com.otoki.uptention.infra.solana.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.otoki.uptention.global.config.SolanaProperties;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Solana 트랜잭션 모니터링 서비스
 * 분리된 서비스들을 조율하는 역할을 합니다.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SolanaTransactionMonitorServiceImpl implements SolanaTransactionMonitorService {

	private final SolanaProperties solanaProperties;
	private final SolanaWebSocketService webSocketService;
	private final SolanaTransactionService transactionService;
	private final SolanaRpcService solanaRpcService;

	// 회사 지갑의 토큰 계정 주소 저장 (토큰 타입별)
	private final Map<String, String> tokenAccountMap = new ConcurrentHashMap<>();

	@PostConstruct
	public void init() {
		log.info("Solana 트랜잭션 모니터링 서비스 초기화 중...");
		log.info("네트워크: {}", solanaProperties.getNetwork());
		log.info("RPC URL: {}", solanaProperties.getRpcUrl());
		log.info("WebSocket URL: {}", solanaProperties.getWebsocketUrl());
		log.info("회사 지갑 주소: {}", solanaProperties.getCompanyWallet());
		log.info("토큰 프로그램 ID: {}", solanaProperties.getTokenProgramId());
		log.info("워크 토큰 민트: {}", solanaProperties.getWorkTokenMint());

		// 워크 토큰 민트가 설정된 경우에만 토큰 계정 검색
		if (solanaProperties.getWorkTokenMint() != null && !solanaProperties.getWorkTokenMint().isEmpty()) {
			findTokenAccounts();
		}
	}

	/**
	 * 회사 지갑이 소유한 토큰 계정 조회
	 */
	private void findTokenAccounts() {
		try {
			log.info("회사 지갑의 토큰 계정 조회 중...");

			// 회사 지갑이 소유한 토큰 계정 조회
			com.fasterxml.jackson.databind.JsonNode response = solanaRpcService.getTokenAccountsByOwner(
				solanaProperties.getCompanyWallet(),
				Map.of("mint", solanaProperties.getWorkTokenMint()),
				Map.of("encoding", "jsonParsed")
			);

			if (response == null) {
				log.warn("토큰 계정 조회 결과가 null입니다");
				return;
			}

			if (response.has("error")) {
				log.warn("토큰 계정 조회 중 오류 발생: {}",
					response.path("error").path("message").asText("알 수 없는 오류"));
				return;
			}

			if (!response.has("result") || !response.get("result").has("value")) {
				log.warn("토큰 계정 응답에 result.value가 없습니다");
				return;
			}

			com.fasterxml.jackson.databind.JsonNode accounts = response.get("result").get("value");

			if (accounts.size() == 0) {
				log.warn("회사 지갑({})에 워크 토큰({})의 토큰 계정이 없습니다.",
					solanaProperties.getCompanyWallet(),
					solanaProperties.getWorkTokenMint());
				return;
			}

			for (com.fasterxml.jackson.databind.JsonNode account : accounts) {
				if (account.has("pubkey")) {
					String tokenAccount = account.get("pubkey").asText();
					tokenAccountMap.put(solanaProperties.getWorkTokenMint(), tokenAccount);
					log.info("워크 토큰({})의 토큰 계정 찾음: {}",
						solanaProperties.getWorkTokenMint(), tokenAccount);
				}
			}
		} catch (Exception e) {
			log.error("토큰 계정 조회 실패", e);
		}
	}

	@PreDestroy
	public void cleanup() {
		log.info("Solana 트랜잭션 모니터링 서비스 종료 중...");
	}

	@Override
	public boolean isWebSocketConnected() {
		return webSocketService.isWebSocketConnected();
	}

	@Override
	public void cleanupProcessedSignatures() {
		transactionService.cleanupProcessedSignatures();
	}

	@Override
	public void checkWebSocketConnection() {
		webSocketService.checkWebSocketConnection();
	}

	/**
	 * 토큰 계정 주소 조회
	 *
	 * @param tokenMint 토큰 민트 주소
	 * @return 토큰 계정 주소 (없으면 null)
	 */
	public String getTokenAccount(String tokenMint) {
		return tokenAccountMap.get(tokenMint);
	}
}
