package com.otoki.uptention.application.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Schema(description = "배송지 정보 등록 요청 DTO")
public class DeliveryInfoRequestDto {

	@NotBlank(message = "배송 주소는 필수입니다.")
	@Schema(description = "배송 주소", required = true, example = "서울시 강남구 테헤란로")
	private String address;
}
