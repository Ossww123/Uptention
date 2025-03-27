package com.otoki.uptention.domain.cart.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "장바구니 상품 정보 응답 DTO")
public class CartItemDto {

	@Schema(description = "장바구니 ID", example = "1")
	private Integer cartId;

	@Schema(description = "상품 ID", example = "1")
	private Integer itemId;

	@Schema(description = "상품 이름", example = "테스트 상품명")
	private String name;

	@Schema(description = "상품 개당 가격", example = "1000")
	private Integer price;

	@Schema(description = "브랜드명", example = "테스트 브랜드")
	private String brand;

	@Schema(description = "장바구니에 담은 수량", example = "10")
	private Integer quantity;

	@Schema(description = "해당 상품의 총 가격", example = "10000")
	private Integer totalPrice;

	@Schema(description = "실제 재고량", example = "10000")
	private Integer stockQuantity;

	@Schema(description = "상품 대표 이미지 URL", example = "https://example.com/images/product_1_1.jpg")
	private String thumbnail;

}
