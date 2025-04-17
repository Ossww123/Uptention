package com.otoki.uptention.infra.solana.dto.request;

import java.util.Collections;
import java.util.List;

import com.otoki.uptention.infra.solana.dto.Attribute;

public class NftCreateRequest {
	public String rank;
	public String name;
	public String description;
	public List<Attribute> attributes;
	public String symbol;

	public NftCreateRequest(String rank, String name, String description,
		List<Attribute> attributes, String symbol) {
		this.rank = rank;
		this.name = name;
		this.description = description;
		this.attributes = (attributes != null) ? attributes : Collections.emptyList();
		this.symbol = symbol;
	}
}
