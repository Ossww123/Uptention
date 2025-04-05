package com.otoki.uptention.solana.service;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

@Service
public class ExpressApiService {

	private static final Logger log = LoggerFactory.getLogger(ExpressApiService.class);
	private final RestTemplate restTemplate;
	private static final String expressBaseUrl = "https://j12d211.p.ssafy.io/sol";

	// 생성자 주입 (RestTemplate)
	public ExpressApiService(RestTemplate restTemplate) {
		this.restTemplate = restTemplate;
	}

	/**
	 * Express API를 호출하여 SPL 토큰을 전송합니다. (동기 방식)
	 * @param recipientAddress 토큰을 받을 주소 (문자열)
	 * @param amount 전송할 양 (문자열 또는 숫자)
	 * @return API 응답 본문 (String)
	 * @throws RestClientException API 호출 실패 시
	 */
	public String transferToken(String recipientAddress, String amount) { // <<< 반환 타입 Mono<String> -> String
		String url = expressBaseUrl + "/api/tokens/transfer";
		log.info("토큰 전송 API 호출 시작 (RestTemplate): {}", url);

		TokenTransferRequest requestDto = new TokenTransferRequest(recipientAddress, amount);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON); // 헤더 설정
		HttpEntity<TokenTransferRequest> entity = new HttpEntity<>(requestDto, headers); // 요청 엔티티 생성

		try {
			// RestTemplate으로 POST 요청 보내고 응답 받기
			ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
			log.info("토큰 전송 API 호출 성공. 상태 코드: {}, 응답: {}", response.getStatusCode(), response.getBody());
			return response.getBody(); // 응답 본문 반환
		} catch (RestClientException e) {
			log.error("토큰 전송 API 호출 오류 발생: {}", e.getMessage());
			throw new CustomException(ErrorCode.POINT_SCHEDULER_ERROR);
		}
	}

	/**
	 * Express API를 호출하여 미리 정의된 URI를 사용하는 NFT를 생성합니다. (JSON 요청, 동기 방식)
	 * @param rank NFT 등급 또는 식별자
	 * @param name NFT 이름
	 * @param description NFT 설명
	 * @param attributes NFT 속성 리스트 (Attribute 객체 리스트)
	 * @param symbol NFT 심볼 (선택 사항)
	 * @return API 응답 본문 (String)
	 * @throws RestClientException API 호출 실패 시
	 */
	public String createNft(String rank, String name, String description, List<Attribute> attributes, String symbol) { // <<< 시그니처는 유지, 반환 타입 변경
		String url = expressBaseUrl + "/api/nfts/create-with-uri";
		log.info("NFT 생성(URI) API 호출 시작 (RestTemplate): {}", url);

		NftCreateRequest requestDto = new NftCreateRequest(rank, name, description, attributes, symbol);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<NftCreateRequest> entity = new HttpEntity<>(requestDto, headers);

		try {
			ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
			log.info("NFT 생성(URI) API 호출 성공. 상태 코드: {}, 응답: {}", response.getStatusCode(), response.getBody());
			return response.getBody();
		} catch (RestClientException e) {
			log.error("NFT 생성(URI) API 호출 오류 발생: {}", e.getMessage());
			throw e;
		}
	}

	/**
	 * Express API를 호출하여 NFT를 전송합니다. (동기 방식)
	 * @param recipientAddress NFT를 받을 주소 (문자열)
	 * @param nftMintAddress 전송할 NFT 민트 주소 (문자열)
	 * @return API 응답 본문 (String)
	 * @throws RestClientException API 호출 실패 시
	 */
	public String transferNft(String recipientAddress, String nftMintAddress) { // <<< 반환 타입 Mono<String> -> String
		String url = expressBaseUrl + "/api/nfts/transfer";
		log.info("NFT 전송 API 호출 시작 (RestTemplate): {}", url);

		NftTransferRequest requestDto = new NftTransferRequest(recipientAddress, nftMintAddress);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<NftTransferRequest> entity = new HttpEntity<>(requestDto, headers);

		try {
			// RestTemplate으로 POST 요청
			ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
			log.info("NFT 전송 API 호출 성공. 상태 코드: {}, 응답: {}", response.getStatusCode(), response.getBody());
			return response.getBody();
		} catch (RestClientException e) {
			log.error("NFT 전송 API 호출 오류 발생: {}", e.getMessage());
			throw e;
		}
	}

	private static class TokenTransferRequest {
		public String recipientAddress;
		public String amount;
		public TokenTransferRequest(String recipientAddress, String amount) {
			this.recipientAddress = recipientAddress;
			this.amount = amount;
		}
	}

	private static class NftCreateRequest { // NftCreateWithUriRequest -> NftCreateRequest 로 이름 변경 (선택사항)
		public String rank;
		public String name;
		public String description;
		public List<Attribute> attributes;
		public String symbol;

		public NftCreateRequest(String rank, String name, String description, List<Attribute> attributes, String symbol) {
			this.rank = rank;
			this.name = name;
			this.description = description;
			this.attributes = (attributes != null) ? attributes : Collections.emptyList();
			this.symbol = symbol;
		}
	}

	private static class NftTransferRequest {
		public String recipientAddress;
		public String nftMintAddress;
		public NftTransferRequest(String recipientAddress, String nftMintAddress) {
			this.recipientAddress = recipientAddress;
			this.nftMintAddress = nftMintAddress;
		}
	}

	// Attribute 클래스 (Map<String, Object> 로 대체하거나 외부 DTO 사용 가능)
	public static class Attribute {
		public String trait_type;
		public String value;
		// 생성자나 getter/setter는 필요에 따라 추가
		public Attribute(String trait_type, String value) {
			this.trait_type = trait_type;
			this.value = value;
		}
	}
}