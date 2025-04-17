package com.otoki.uptention.infra.solana.service;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.otoki.uptention.global.config.SolanaProperties;

import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Solana RPC 서비스 구현체
 * Solana 블록체인과의 통신을 담당하는 서비스 클래스
 */
@Service
@Slf4j
public class SolanaRpcServiceImpl implements SolanaRpcService {

	// 상수 정의
	private static final String JSON_RPC_VERSION = "2.0";
	private static final String CONTENT_TYPE = "application/json";
	private static final String ENCODING_JSON = "json";
	private static final String ENCODING_JSON_PARSED = "jsonParsed";
	private static final String COMMITMENT_CONFIRMED = "confirmed";

	private static final int DEFAULT_ID = 1;
	private static final int HTTP_TIMEOUT_SECONDS = 30;

	// RPC 메서드 상수
	private static final String METHOD_GET_TRANSACTION = "getTransaction";
	private static final String METHOD_GET_SIGNATURES = "getSignaturesForAddress";
	private static final String METHOD_GET_BALANCE = "getBalance";
	private static final String METHOD_GET_TOKEN_ACCOUNTS = "getTokenAccountsByOwner";
	private static final String METHOD_ACCOUNT_SUBSCRIBE = "accountSubscribe";

	private final OkHttpClient httpClient;
	private final ObjectMapper objectMapper;
	private final SolanaProperties solanaProperties;
	private final MediaType jsonMediaType;

	@Autowired
	public SolanaRpcServiceImpl(SolanaProperties solanaProperties, ObjectMapper objectMapper) {
		this.solanaProperties = solanaProperties;
		this.objectMapper = objectMapper;
		this.jsonMediaType = MediaType.parse(CONTENT_TYPE);

		// HTTP 클라이언트 초기화 (타임아웃 설정)
		this.httpClient = new OkHttpClient.Builder()
			.connectTimeout(HTTP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
			.readTimeout(HTTP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
			.writeTimeout(HTTP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
			.build();
	}

	/**
	 * 트랜잭션 세부 정보 조회
	 *
	 * @param signature 트랜잭션 서명
	 * @return 트랜잭션 정보를 담은 JsonNode
	 */
	@Override
	@Retryable(value = {IOException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
	public JsonNode getTransaction(String signature) throws IOException {
		log.debug("트랜잭션 세부 정보 RPC 조회: {}", signature);

		ObjectNode paramsObj = objectMapper.createObjectNode();
		paramsObj.put("encoding", ENCODING_JSON);

		ObjectNode requestNode = createRequestNode(METHOD_GET_TRANSACTION);
		requestNode.putArray("params")
			.add(signature)
			.add(paramsObj);

		return executeRpcCall(requestNode, "트랜잭션 세부 정보 RPC 호출 완료: " + signature);
	}

	/**
	 * 회사 지갑의 최근 트랜잭션 서명 목록 조회
	 *
	 * @param limit 조회할 트랜잭션 수
	 * @return 트랜잭션 서명 목록
	 */
	@Override
	@Retryable(value = {IOException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
	public List<String> getRecentTransactions(int limit) throws IOException {
		log.debug("최근 트랜잭션 목록 조회 (limit={})", limit);

		ObjectNode options = objectMapper.createObjectNode();
		options.put("limit", limit);

		ObjectNode requestNode = createRequestNode(METHOD_GET_SIGNATURES);
		requestNode.putArray("params")
			.add(solanaProperties.getCompanyWallet())
			.add(options);

		JsonNode response = executeRpcCall(requestNode, "최근 트랜잭션 목록 조회 완료");

		return objectMapper.convertValue(
			response.get("result").findValuesAsText("signature"),
			objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
		);
	}

	/**
	 * 지갑 잔액 조회
	 *
	 * @param address 지갑 주소
	 * @return lamports 단위의 잔액
	 */
	@Override
	@Retryable(value = {IOException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
	public long getBalance(String address) throws IOException {
		log.debug("지갑 잔액 조회: {}", address);

		ObjectNode requestNode = createRequestNode(METHOD_GET_BALANCE);
		requestNode.putArray("params").add(address);

		JsonNode response = executeRpcCall(requestNode, "지갑 잔액 조회 완료: " + address);

		return response.path("result").path("value").asLong();
	}

	/**
	 * 회사 지갑 잔액 조회
	 *
	 * @return lamports 단위의 잔액
	 */
	@Override
	public long getCompanyWalletBalance() throws IOException {
		return getBalance(solanaProperties.getCompanyWallet());
	}

	/**
	 * 특정 소유자의 토큰 계정 조회
	 *
	 * @param owner 소유자 지갑 주소
	 * @param filter 필터 (예: 특정 민트로 필터링)
	 * @param options 추가 옵션
	 * @return 토큰 계정 정보
	 */
	@Override
	@Retryable(value = {IOException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
	public JsonNode getTokenAccountsByOwner(String owner, Object filter, Object options) throws IOException {
		log.debug("토큰 계정 RPC 조회: 소유자={}", owner);

		ObjectNode requestNode = createRequestNode(METHOD_GET_TOKEN_ACCOUNTS);

		// 파라미터 배열 생성
		requestNode.putArray("params")
			.add(owner)
			.add(objectMapper.valueToTree(filter))
			.add(objectMapper.valueToTree(options));

		return executeRpcCall(requestNode, "토큰 계정 조회 RPC 호출 완료");
	}

	/**
	 * WebSocket 구독 메시지 생성
	 *
	 * @return 회사 지갑 주소에 대한 WebSocket 구독 메시지
	 */
	@Override
	public String createAccountSubscribeMessage() throws IOException {
		ObjectNode requestNode = createRequestNode(METHOD_ACCOUNT_SUBSCRIBE);

		ObjectNode configNode = objectMapper.createObjectNode();
		configNode.put("encoding", ENCODING_JSON_PARSED);
		configNode.put("commitment", COMMITMENT_CONFIRMED);

		requestNode.putArray("params")
			.add(solanaProperties.getCompanyWallet())
			.add(configNode);

		return objectMapper.writeValueAsString(requestNode);
	}

	/**
	 * 기본 RPC 요청 노드 생성
	 *
	 * @param method RPC 메서드 이름
	 * @return 기본 요청 노드
	 */
	private ObjectNode createRequestNode(String method) {
		ObjectNode requestNode = objectMapper.createObjectNode();
		requestNode.put("jsonrpc", JSON_RPC_VERSION);
		requestNode.put("id", DEFAULT_ID);
		requestNode.put("method", method);
		return requestNode;
	}

	/**
	 * RPC 호출 실행
	 *
	 * @param requestNode JSON 요청 노드
	 * @param successMessage 성공 시 로깅할 메시지
	 * @return JSON 응답
	 * @throws IOException RPC 통신 오류 발생 시
	 */
	private JsonNode executeRpcCall(ObjectNode requestNode, String successMessage) throws IOException {
		String requestJson = objectMapper.writeValueAsString(requestNode);
		log.debug("RPC 요청 JSON: {}", requestJson);

		RequestBody body = RequestBody.create(jsonMediaType, requestJson);

		Request request = new Request.Builder()
			.url(solanaProperties.getRpcUrl())
			.post(body)
			.build();

		log.info("HTTP 요청 실행: {}", solanaProperties.getRpcUrl());

		try (Response response = httpClient.newCall(request).execute()) {
			log.info("HTTP 응답 코드: {}", response.code());

			if (!response.isSuccessful()) {
				String errorMsg = "RPC 요청 실패: " + response.code();
				log.error(errorMsg);
				throw new IOException(errorMsg);
			}

			String responseBody = response.body().string();
			log.debug("RPC 응답 본문: {}", responseBody);

			JsonNode result = objectMapper.readTree(responseBody);
			log.info(successMessage);
			return result;
		}
	}
}
