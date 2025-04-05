package com.otoki.uptention.presentation.solana.controller;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.global.config.SolanaProperties;
import com.otoki.uptention.solana.service.SolanaRpcService;
import com.otoki.uptention.solana.service.SolanaTransactionMonitorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/test/solana")
public class SolanaTestController {

	private final SolanaProperties solanaProperties;
	private final SolanaRpcService solanaRpcService;
	private final SolanaTransactionMonitorService monitorService;

	@GetMapping("/config")
	public ResponseEntity<Map<String, String>> getConfig() {
		Map<String, String> config = new HashMap<>();
		config.put("network", solanaProperties.getNetwork());
		config.put("rpcUrl", solanaProperties.getRpcUrl());
		config.put("websocketUrl", solanaProperties.getWebsocketUrl());
		config.put("companyWallet", solanaProperties.getCompanyWallet());

		return ResponseEntity.ok(config);
	}

	@GetMapping("/transaction/{signature}")
	public ResponseEntity<JsonNode> getTransaction(@PathVariable String signature) {
		try {
			JsonNode transactionData = solanaRpcService.getTransaction(signature);
			return ResponseEntity.ok(transactionData);
		} catch (IOException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/recent-transactions")
	public ResponseEntity<List<String>> getRecentTransactions(@RequestParam(defaultValue = "10") int limit) {
		try {
			List<String> signatures = solanaRpcService.getRecentTransactions(limit);
			return ResponseEntity.ok(signatures);
		} catch (IOException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/company-balance")
	public ResponseEntity<Long> getCompanyBalance() {
		try {
			long balance = solanaRpcService.getCompanyWalletBalance();
			return ResponseEntity.ok(balance);
		} catch (IOException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@PostMapping("/process-transaction")
	public ResponseEntity<?> processTransactionManually(@RequestParam String signature) {
		try {
			// private 메소드를 호출하기 위한 리플렉션 사용
			Method processMethod = SolanaTransactionMonitorService.class
				.getDeclaredMethod("processTransaction", String.class);
			processMethod.setAccessible(true);

			processMethod.invoke(monitorService, signature);

			return ResponseEntity.ok("트랜잭션 처리 요청 완료: " + signature);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body("트랜잭션 처리 실패: " + e.getMessage());
		}
	}

	@GetMapping("/pending-orders")
	public ResponseEntity<?> getPendingOrders() {
		try {
			// private 필드를 액세스하기 위한 리플렉션 사용
			Field cacheField = SolanaTransactionMonitorService.class
				.getDeclaredField("pendingOrdersCache");
			cacheField.setAccessible(true);

			Map<Integer, Order> pendingOrders =
				(Map<Integer, Order>)cacheField.get(monitorService);

			// 보안을 위해 필요한 정보만 응답
			List<Map<String, Object>> orderInfoList = pendingOrders.entrySet().stream()
				.map(entry -> {
					Map<String, Object> orderInfo = new HashMap<>();
					orderInfo.put("orderId", entry.getKey());
					orderInfo.put("status", entry.getValue().getStatus().name());
					return orderInfo;
				})
				.collect(Collectors.toList());

			return ResponseEntity.ok(orderInfoList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body("대기 주문 조회 실패: " + e.getMessage());
		}
	}

	@GetMapping("/check-connection")
	public ResponseEntity<Map<String, Object>> checkConnection() {
		boolean isConnected = false;
		try {
			isConnected = monitorService.isWebSocketConnected();
			Map<String, Object> response = new HashMap<>();
			response.put("webSocketConnected", isConnected);
			response.put("timestamp", System.currentTimeMillis());

			// 추가적인 진단 정보
			try {
				List<String> recentTxs = solanaRpcService.getRecentTransactions(5);
				response.put("recentTransactions", recentTxs);
			} catch (Exception e) {
				response.put("recentTransactionsError", e.getMessage());
			}

			return ResponseEntity.ok(response);
		} catch (Exception e) {
			Map<String, Object> response = new HashMap<>();
			response.put("webSocketConnected", false);
			response.put("error", e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	// @PostMapping("/refresh-orders")
	// public ResponseEntity<?> refreshPendingOrders() {
	// 	try {
	// 		monitorService.refreshPendingOrders();
	// 		return ResponseEntity.ok("대기 중인 주문 목록 새로고침 완료");
	// 	} catch (Exception e) {
	// 		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	// 			.body("대기 주문 새로고침 실패: " + e.getMessage());
	// 	}
	// }
}
