package com.otoki.uptention.application.mining.dto.response;

import lombok.Getter;

@Getter
public class CreateNftApiResponse {
	private boolean success;
	private String message;
	private String mintAddress;
	private String transaction;
}
