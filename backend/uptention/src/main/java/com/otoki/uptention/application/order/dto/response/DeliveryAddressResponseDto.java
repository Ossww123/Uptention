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
@Schema(description = "최근 배송지 정보 DTO")
public class DeliveryAddressResponseDto {

	@Schema(description = "배송 주소", required = true, example = "서울시 강남구 테헤란로")
	private String address;
}
