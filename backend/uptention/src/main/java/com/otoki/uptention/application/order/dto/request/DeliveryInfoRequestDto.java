package com.otoki.uptention.application.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "배송지 정보 등록 요청 DTO")
public class DeliveryInfoRequestDto {

	@Schema(description = "주문 ID", example = "1", required = true)
	private Integer orderId;

	@NotBlank(message = "배송 주소는 필수입니다.")
	@Schema(description = "배송 주소", required = true, example = "서울시 강남구 테헤란로")
	private String address;
}
