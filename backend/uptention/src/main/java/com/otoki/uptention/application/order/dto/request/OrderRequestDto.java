package com.otoki.uptention.application.order.dto.request;

import java.util.List;

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
public class OrderRequestDto {

	@NotEmpty(message = "주문 상품 목록은 필수입니다.")
	private List<OrderItemRequestDto> items;

	@NotBlank(message = "배송 주소는 필수입니다.")
	private String address;

	// 내부 DTO 클래스
	@Getter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public static class OrderItemRequestDto {

		private Integer itemId;

		private Integer quantity;
	}
}
