package com.otoki.uptention.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "solana")
public class SolanaProperties {
	private String network;
	private String rpcUrl;
	private String websocketUrl;
	private String companyWallet;

}