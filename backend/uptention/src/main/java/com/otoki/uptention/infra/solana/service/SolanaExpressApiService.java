package com.otoki.uptention.infra.solana.service;

import java.util.List;
import com.otoki.uptention.infra.solana.dto.Attribute;

public interface SolanaExpressApiService {

	public String transferToken(String recipientAddress, String amount);
	public String createNft(String rank, String name, String description, List<Attribute> attributes, String symbol);
	public String transferNft(String recipientAddress, String nftMintAddress);
}