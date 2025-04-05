package com.otoki.uptention.domain.inventory.dto;

import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDto implements Serializable {
	private Integer itemId;
	private Integer quantity;
	private Integer reservedQuantity; // 결제 진행 중인 재고
	private Integer availableQuantity; // 실제 이용 가능한 재고
}