package com.otoki.uptention.infra.solana.service;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.otoki.uptention.global.config.SolanaProperties;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Solana 트랜잭션 정보를 처리하고 관리하는 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SolanaTransactionServiceImpl implements SolanaTransactionService {

	private static final String DATE_FORMAT_PATTERN = "yyyy-MM-dd HH:mm:ss";
	private static final String ORDER_PREFIX = "ORDER_";
	private static final String MEMO_LOG_IDENTIFIER = "Memo";
	private static final int MAX_PROCESSED_SIGNATURES = 1000;
	private static final int CLEANUP_THRESHOLD = 500;

	private final SolanaProperties solanaProperties;
	private final SolanaRpcService solanaRpcService;
	private final SolanaPaymentVerifyService solanaPaymentVerifyService;

	// 이미 처리된 트랜잭션 서명을 추적 (중복 처리 방지)
	private final List<String> processedSignatures = new CopyOnWriteArrayList<>();

	@PostConstruct
	public void init() {
		log.info("Solana 트랜잭션 서비스 초기화 중...");
	}

	/**
	 * 트랜잭션이 이미 처리되었는지 확인
	 */
	public boolean isProcessedSignature(String signature) {
		return processedSignatures.contains(signature);
	}

	/**
	 * 트랜잭션 서명을 처리된 목록에 추가
	 */
	public void addProcessedSignature(String signature) {
		processedSignatures.add(signature);
	}

	/**
	 * WebSocket에서 받은 로그로 트랜잭션 처리
	 */
	public void processTransactionWithLogs(String signature, List<String> logs) {
		log.info("======== 트랜잭션 상세 정보 (WebSocket) ========");
		log.info("트랜잭션 서명: {}", signature);

		if (logs == null || logs.isEmpty()) {
			log.info("로그 메시지를 찾을 수 없습니다");
			return;
		}

		// 로그 출력 및 주문 ID 찾기
		String orderId = findOrderIdFromLogs(logs);

		// 주문 ID가 추출된 경우 처리
		if (orderId != null && orderId.startsWith(ORDER_PREFIX)) {
			String orderIdOnly = orderId.substring(ORDER_PREFIX.length()); // "ORDER_" 제거

			// 주문 처리를 위한 시간 정보는 현재 시간으로 대체 (블록 시간 정보가 없으므로)
			long currentBlockTime = Instant.now().getEpochSecond();

			// 주문 처리 로직 호출
			solanaPaymentVerifyService.processOrder(orderIdOnly, currentBlockTime, null, signature);
		}

		// 처리 완료된 트랜잭션 서명 추가
		addProcessedSignature(signature);
		log.info("================================");
	}

	/**
	 * 트랜잭션 서명으로 트랜잭션 조회 및 처리
	 */
	public void processTransactionBySignature(String signature) {
		JsonNode transactionData = fetchTransactionDetails(signature);
		if (transactionData != null) {
			logTransactionDetails(transactionData, signature);
			addProcessedSignature(signature);
		}
	}

	/**
	 * Solana RPC를 통해 트랜잭션 세부 정보 조회
	 */
	public JsonNode fetchTransactionDetails(String signature) {
		try {
			log.info("트랜잭션 세부 정보 조회 시작: {}", signature);

			if (solanaRpcService == null) {
				log.error("SolanaRpcService가 주입되지 않았습니다.");
				return null;
			}

			log.info("SolanaRpcService.getTransaction 호출: {}", signature);
			JsonNode transactionData = solanaRpcService.getTransaction(signature);
			log.info("SolanaRpcService.getTransaction 호출 완료: {}", signature);

			if (transactionData == null) {
				log.warn("트랜잭션 데이터가 null입니다: {}", signature);
				return null;
			}

			if (transactionData.has("error")) {
				log.warn("트랜잭션 조회 중 오류 발생: {} - {}",
					signature,
					transactionData.path("error").path("message").asText("알 수 없는 오류"));
				return null;
			}

			log.info("트랜잭션 세부 정보 조회 성공: {}", signature);
			return transactionData;
		} catch (IOException e) {
			log.error("트랜잭션 세부 정보 조회 중 IOException 발생: {}", signature, e);
			return null;
		} catch (Exception e) {
			log.error("트랜잭션 세부 정보 처리 중 예상치 못한 오류: {}", signature, e);
			return null;
		}
	}

	/**
	 * 트랜잭션 데이터의 중요 정보를 로깅
	 */
	private void logTransactionDetails(JsonNode transactionData, String signature) {
		try {
			log.info("======== 트랜잭션 상세 정보 ========");
			log.info("트랜잭션 서명: {}", signature);

			if (transactionData == null) {
				log.info("트랜잭션 데이터가 없습니다");
				return;
			}

			JsonNode result = transactionData.get("result");
			if (result == null) {
				log.info("트랜잭션 데이터에 result 필드 없음");
				return;
			}

			// 블록 정보 로깅
			long blockTime = 0;
			if (result.has("blockTime")) {
				blockTime = result.get("blockTime").asLong();
				Date date = new Date(blockTime * 1000L);
				log.info("블록 타임스탬프: {} ({})", blockTime,
					new SimpleDateFormat(DATE_FORMAT_PATTERN).format(date));
			}

			// logMessages에서 주문 ID 추출
			if (result.has("meta") && result.get("meta").has("logMessages")) {
				JsonNode logMessages = result.get("meta").get("logMessages");

				// 로그 메시지들을 리스트로 변환
				List<String> logs = new CopyOnWriteArrayList<>();
				for (JsonNode logMessage : logMessages) {
					logs.add(logMessage.asText());
				}

				// 주문 ID 추출
				String orderId = findOrderIdFromLogs(logs);

				// 주문 ID가 추출된 경우에만 처리 진행
				if (orderId != null && orderId.startsWith(ORDER_PREFIX)) {
					String orderIdOnly = orderId.substring(ORDER_PREFIX.length()); // "ORDER_" 제거
					solanaPaymentVerifyService.processOrder(orderIdOnly, blockTime, result, signature);
				} else {
					log.info("주문 ID를 찾을 수 없습니다");
				}
			} else {
				log.info("로그 메시지를 찾을 수 없습니다");
			}

			log.info("================================");
		} catch (Exception e) {
			log.error("트랜잭션 상세 정보 로깅 중 오류", e);
		}
	}

	/**
	 * 로그 메시지에서 주문 ID를 찾습니다
	 */
	public String findOrderIdFromLogs(List<String> logs) {
		for (String logMessage : logs) {
			log.info("로그 메시지: {}", logMessage);

			// Memo 프로그램 로그에서 주문 ID 추출
			if (logMessage.contains(MEMO_LOG_IDENTIFIER) && logMessage.contains(ORDER_PREFIX)) {
				int startIdx = logMessage.indexOf(ORDER_PREFIX);
				if (startIdx != -1) {
					int endIdx = logMessage.lastIndexOf("\"");
					if (endIdx > startIdx) {
						String orderId = logMessage.substring(startIdx, endIdx);
						log.info("주문 ID 감지: {}", orderId);
						return orderId;
					} else {
						String orderId = logMessage.substring(startIdx);
						log.info("주문 ID 감지: {}", orderId);
						return orderId;
					}
				}
			}
		}
		log.info("주문 ID를 찾을 수 없습니다");
		return null;
	}

	/**
	 * 지나치게 오래된 처리 완료된 트랜잭션 서명 정리 (메모리 관리)
	 */
	public void cleanupProcessedSignatures() {
		try {
			if (processedSignatures.size() > MAX_PROCESSED_SIGNATURES) {
				log.info("오래된 트랜잭션 서명 정리 중... (현재 크기: {})", processedSignatures.size());
				processedSignatures.subList(0, CLEANUP_THRESHOLD).clear();
				log.info("오래된 트랜잭션 서명 정리 완료 (현재 크기: {})", processedSignatures.size());
			}
		} catch (Exception e) {
			log.error("트랜잭션 서명 정리 실패", e);
		}
	}
}
