package com.otoki.uptention.solana.service;

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
 * Solana RPC 서비스
 * Solana 블록체인과의 통신을 담당하는 서비스 클래스
 */
@Service
@Slf4j
public class SolanaRpcServiceImpl implements SolanaRpcService{

	private final OkHttpClient httpClient;
	private final ObjectMapper objectMapper;
	private final SolanaProperties solanaProperties;

	@Autowired
	public SolanaRpcServiceImpl(SolanaProperties solanaProperties, ObjectMapper objectMapper) {
		this.solanaProperties = solanaProperties;
		this.objectMapper = objectMapper;

		// HTTP 클라이언트 초기화 (타임아웃 설정)
		this.httpClient = new OkHttpClient.Builder()
			.connectTimeout(30, TimeUnit.SECONDS)
			.readTimeout(30, TimeUnit.SECONDS)
			.writeTimeout(30, TimeUnit.SECONDS)
			.build();
	}

	/**
	 * 트랜잭션 세부 정보 조회
	 *
	 * @param signature 트랜잭션 서명
	 * @return 트랜잭션 정보를 담은 JsonNode
	 */
	@Retryable(value = {IOException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
	public JsonNode getTransaction(String signature) throws IOException {
		log.debug("트랜잭션 세부 정보 RPC 조회: {}", signature);

		ObjectNode requestNode = objectMapper.createObjectNode();
		requestNode.put("jsonrpc", "2.0");
		requestNode.put("id", 1);
		requestNode.put("method", "getTransaction");

		ObjectNode paramsObj = objectMapper.createObjectNode();
		paramsObj.put("encoding", "json");

		requestNode.putArray("params")
			.add(signature)
			.add(paramsObj);

		String requestJson = objectMapper.writeValueAsString(requestNode);
		log.debug("RPC 요청 JSON: {}", requestJson);

		RequestBody body = RequestBody.create(
			MediaType.parse("application/json"), requestJson);

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
			log.info("트랜잭션 세부 정보 RPC 호출 완료: {}", signature);
			return result;
		}
	}

	/**
	 * 회사 지갑의 최근 트랜잭션 서명 목록 조회
	 *
	 * @param limit 조회할 트랜잭션 수
	 * @return 트랜잭션 서명 목록
	 */
	@Retryable(value = {IOException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
	public List<String> getRecentTransactions(int limit) throws IOException {
		log.debug("최근 트랜잭션 목록 조회 (limit={})", limit);

		ObjectNode requestNode = objectMapper.createObjectNode();
		requestNode.put("jsonrpc", "2.0");
		requestNode.put("id", 1);
		requestNode.put("method", "getSignaturesForAddress");

		ObjectNode options = objectMapper.createObjectNode();
		options.put("limit", limit);

		requestNode.putArray("params")
			.add(solanaProperties.getCompanyWallet())
			.add(options);

		String requestJson = objectMapper.writeValueAsString(requestNode);

		RequestBody body = RequestBody.create(
			MediaType.parse("application/json"), requestJson);

		Request request = new Request.Builder()
			.url(solanaProperties.getRpcUrl())
			.post(body)
			.build();

		try (Response response = httpClient.newCall(request).execute()) {
			if (!response.isSuccessful()) {
				throw new IOException("RPC 요청 실패: " + response.code());
			}

			String responseBody = response.body().string();
			JsonNode jsonResponse = objectMapper.readTree(responseBody);

			return objectMapper.convertValue(
				jsonResponse.get("result").findValuesAsText("signature"),
				objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
			);
		}
	}

	/**
	 * 지갑 잔액 조회
	 *
	 * @param address 지갑 주소
	 * @return lamports 단위의 잔액
	 */
	@Retryable(value = {IOException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
	public long getBalance(String address) throws IOException {
		ObjectNode requestNode = objectMapper.createObjectNode();
		requestNode.put("jsonrpc", "2.0");
		requestNode.put("id", 1);
		requestNode.put("method", "getBalance");

		requestNode.putArray("params").add(address);

		String requestJson = objectMapper.writeValueAsString(requestNode);

		RequestBody body = RequestBody.create(
			MediaType.parse("application/json"), requestJson);

		Request request = new Request.Builder()
			.url(solanaProperties.getRpcUrl())
			.post(body)
			.build();

		try (Response response = httpClient.newCall(request).execute()) {
			if (!response.isSuccessful()) {
				throw new IOException("RPC 요청 실패: " + response.code());
			}

			String responseBody = response.body().string();
			JsonNode jsonResponse = objectMapper.readTree(responseBody);

			return jsonResponse.path("result").path("value").asLong();
		}
	}

	/**
	 * 회사 지갑 잔액 조회
	 *
	 * @return lamports 단위의 잔액
	 */
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
	@Retryable(value = {IOException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
	public JsonNode getTokenAccountsByOwner(String owner, Object filter, Object options) throws IOException {
		log.debug("토큰 계정 RPC 조회: 소유자={}", owner);

		ObjectNode requestNode = objectMapper.createObjectNode();
		requestNode.put("jsonrpc", "2.0");
		requestNode.put("id", 1);
		requestNode.put("method", "getTokenAccountsByOwner");

		// 파라미터 배열 생성
		requestNode.putArray("params")
			.add(owner)
			.add(objectMapper.valueToTree(filter))
			.add(objectMapper.valueToTree(options));

		String requestJson = objectMapper.writeValueAsString(requestNode);
		log.debug("RPC 요청 JSON: {}", requestJson);

		RequestBody body = RequestBody.create(
			MediaType.parse("application/json"), requestJson);

		Request request = new Request.Builder()
			.url(solanaProperties.getRpcUrl())
			.post(body)
			.build();

		log.info("토큰 계정 조회 HTTP 요청 실행");

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
			log.info("토큰 계정 조회 RPC 호출 완료");
			return result;
		}
	}

	/**
	 * WebSocket 구독 메시지 생성
	 *
	 * @return 회사 지갑 주소에 대한 WebSocket 구독 메시지
	 */
	public String createAccountSubscribeMessage() throws IOException {
		ObjectNode requestNode = objectMapper.createObjectNode();
		requestNode.put("jsonrpc", "2.0");
		requestNode.put("id", 1);
		requestNode.put("method", "accountSubscribe");

		ObjectNode configNode = objectMapper.createObjectNode();
		configNode.put("encoding", "jsonParsed");
		configNode.put("commitment", "confirmed");

		requestNode.putArray("params")
			.add(solanaProperties.getCompanyWallet())
			.add(configNode);

		return objectMapper.writeValueAsString(requestNode);
	}
}