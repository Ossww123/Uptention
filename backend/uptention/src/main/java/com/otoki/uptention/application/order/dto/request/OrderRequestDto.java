package com.otoki.uptention.application.order.dto.request;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "주문 요청 DTO")
public class OrderRequestDto {

	@Valid
	@NotEmpty(message = "주문 상품 목록은 필수입니다.")
	@Schema(description = "주문 상품 목록", required = true)
	private List<ItemQuantityRequestDto> items;

	@NotBlank(message = "배송 주소는 필수입니다.")
	@Schema(description = "배송 주소", required = true, example = "서울시 강남구 테헤란로")
	private String address;

}
