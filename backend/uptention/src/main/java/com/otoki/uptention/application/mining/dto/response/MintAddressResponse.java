package com.otoki.uptention.application.mining.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MintAddressResponse {
	private Integer id;
	private String address;
	private String wallet;
}
