package com.otoki.uptention.application.order.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "구매 상품 정보")
public class ItemVerificationResponseDto {
	@Schema(description = "상품 ID", example = "1")
	private Integer itemId;

	@Schema(description = "상품 이름", example = "테스트 상품명")
	private String name;

	@Schema(description = "상품 가격", example = "100")
	private Integer price;

	@Schema(description = "브랜드명", example = "테스트 브랜드")
	private String brand;

	@Schema(description = "구매 수량", example = "2")
	private Integer quantity;

	@Schema(description = "총 가격", example = "200")
	private Integer totalPrice;

	@Schema(description = "상품 대표 이미지 URL", example = "https://example.com/images/product_1_1.jpg")
	private String thumbnail;
}
