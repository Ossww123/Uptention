package com.otoki.uptention.infra.solana.dto.request;

import lombok.Builder;

@Builder
public class TokenTransferRequest {
	public String recipientAddress;
	public String amount;
}
