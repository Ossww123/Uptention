package com.otoki.uptention.application.item.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "상품 등록 요청 DTO")
public class ItemCreateRequestDto {
	@NotNull(message = "카테고리 ID는 필수입니다.")
	@Schema(description = "카테고리 ID", example = "1")
	private Integer categoryId;

	@NotBlank(message = "상품명은 필수입니다.")
	@Size(max = 255, message = "상품명은 최대 30자까지 입력 가능합니다.")
	@Schema(description = "상품명", example = "프리미엄 커피")
	private String name;

	@NotBlank(message = "브랜드명은 필수입니다.")
	@Size(max = 50, message = "브랜드명은 최대 50자까지 입력 가능합니다.")
	@Schema(description = "브랜드명", example = "스타벅스")
	private String brand;

	@NotNull(message = "가격은 필수입니다.")
	@Min(value = 1, message = "가격은 1원 이상이어야 합니다.")
	@Max(value = 5000, message = "가격은 최대 5000원까지 설정 가능합니다.")
	@Schema(description = "가격", example = "4500")
	private Integer price;

	@NotBlank(message = "상품 설명은 필수입니다.")
	@Size(max = 255, message = "상품 설명은 최대 255자까지 입력 가능합니다.")
	@Schema(description = "상품 설명", example = "고급 원두로 만든 프리미엄 커피입니다.")
	private String detail;

	@NotNull(message = "수량은 필수입니다.")
	@Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
	@Max(value = 99, message = "수량은 최대 99개까지 설정 가능합니다.")
	@Schema(description = "수량", example = "50")
	private Integer quantity;
}