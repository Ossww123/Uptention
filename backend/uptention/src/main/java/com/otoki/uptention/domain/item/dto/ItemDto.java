package com.otoki.uptention.domain.item.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "상품 정보 응답")
public class ItemDto {
	@Schema(description = "상품 ID", example = "1")
	private Integer itemId;

	@Schema(description = "상품 이름", example = "테스트 상품명")
	private String name;

	@Schema(description = "상품 가격", example = "100")
	private Integer price;

	@Schema(description = "브랜드명", example = "테스트 브랜드")
	private String brand;

	@Schema(description = "재고 수량", example = "10")
	private int quantity;

	@Schema(description = "상품 대표 이미지 URL", example = "https://example.com/images/product_1_1.jpg")
	private String thumbnail;

	@Schema(description = "판매량", example = "30")
	private int salesCount;

	@Schema(description = "상품 상태 (활성/비활성)", example = "true")
	private Boolean status;
}
