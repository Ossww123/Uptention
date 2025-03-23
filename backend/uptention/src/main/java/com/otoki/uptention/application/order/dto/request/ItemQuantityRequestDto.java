package com.otoki.uptention.application.order.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemQuantityRequestDto {
	private Integer itemId;
	private Integer quantity;
}
