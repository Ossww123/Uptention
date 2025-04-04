package com.otoki.uptention.solana.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;


@Service
public class ExpressApiServiceWebClient {

	private static final Logger log = LoggerFactory.getLogger(ExpressApiServiceWebClient.class);
	private final WebClient webClient;
	private final String expressBaseUrl = "https://j12d211.p.ssafy.io/sol";

	public ExpressApiServiceWebClient(WebClient webClient) {
		this.webClient = webClient;
	}

	/**
	 * Express API를 호출하여 SPL 토큰을 전송합니다.
	 * @param recipientAddress 토큰을 받을 주소 (문자열)
	 * @param amount 전송할 양 (문자열 또는 숫자)
	 * @return API 응답 본문을 담은 Mono<String>
	 */
	public Mono<String> transferToken(String recipientAddress, String amount) {
		String url = expressBaseUrl + "/api/tokens/transfer";
		log.info("토큰 전송 API 호출 시작 (WebClient): {}", url);
		TokenTransferRequest requestDto = new TokenTransferRequest(recipientAddress, amount);
		return webClient.post()
			.uri(url)
			.contentType(MediaType.APPLICATION_JSON)
			.bodyValue(requestDto)
			.retrieve()
			.bodyToMono(String.class)
			.doOnSuccess(responseBody -> log.info("토큰 전송 API 호출 성공. 응답: {}", responseBody))
			.doOnError(error -> log.error("토큰 전송 API 호출 오류 발생", error));
	}

	// 토큰 전송 요청 DTO
	private static class TokenTransferRequest {
		public String recipientAddress;
		public String amount;
		public TokenTransferRequest(String recipientAddress, String amount) {
			this.recipientAddress = recipientAddress;
			this.amount = amount;
		}
	}
}