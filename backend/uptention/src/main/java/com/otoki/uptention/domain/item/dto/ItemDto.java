package com.otoki.uptention.domain.item.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDto {
	private Integer itemId;
	private String name;
	private int price;
	private String brand;
	private String thumbnail;
	private int salesCount;
}
