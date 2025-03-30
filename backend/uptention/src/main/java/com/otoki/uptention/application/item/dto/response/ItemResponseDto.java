package com.otoki.uptention.application.item.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.otoki.uptention.domain.image.entity.Image;
import com.otoki.uptention.domain.item.entity.Item;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "상품 상세 정보 응답")
public class ItemResponseDto {
	@Schema(description = "상품 ID", example = "1")
	private Integer itemId;

	@Schema(description = "상품 이름", example = "테스트 상품명")
	private String name;

	@Schema(description = "상품 상세 설명", example = "가전디지털 카테고리의 테스트 상품 1에 대한 상세 설명입니다.")
	private String detail;

	@Schema(description = "상품 가격", example = "100")
	private Integer price;

	@Schema(description = "브랜드명", example = "테스트 브랜드")
	private String brand;

	@Schema(description = "재고 수량", example = "10")
	private int quantity;

	@Schema(description = "카테고리 ID", example = "1")
	private Integer categoryId;

	@Schema(description = "카테고리 이름", example = "가전디지털")
	private String categoryName;

	@Schema(description = "상품 이미지 URL 목록", example = "[\"https://example.com/images/product_1_1.jpg\", \"https://example.com/images/product_1_2.jpg\"]")
	private List<String> images;

	@Schema(description = "상품 생성 일시", example = "2025-03-21T04:05:54")
	private LocalDateTime createdAt;

	public static ItemResponseDto from(Item item, List<Image> imageList) {
		return ItemResponseDto.builder()
			.itemId(item.getId())
			.name(item.getName())
			.detail(item.getDetail())
			.price(item.getPrice())
			.brand(item.getBrand())
			.quantity(item.getQuantity())
			.categoryId(item.getCategory().getId())
			.categoryName(item.getCategory().getName())
			.images(imageList.stream()
				.map(Image::getUrl)
				.collect(Collectors.toList()))
			.createdAt(item.getCreatedAt())
			.build();
	}
}

