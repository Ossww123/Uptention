package com.otoki.uptention.infra.solana.dto.request;

import lombok.Builder;

@Builder
public class NftTransferRequest {
	public String recipientAddress;
	public String nftMintAddress;
}
