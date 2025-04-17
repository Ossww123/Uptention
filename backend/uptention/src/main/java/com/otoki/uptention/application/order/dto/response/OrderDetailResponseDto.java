package com.otoki.uptention.application.order.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

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
@JsonInclude(JsonInclude.Include.NON_NULL) // null 값을 가진 필드는 응답에서 제외
@Schema(description = "주문 상세 조회 응답 DTO")
public class OrderDetailResponseDto {
	// 공통 응답 필드
	@Schema(description = "주문 상품 ID", example = "1")
	private Integer orderItemId;

	@Schema(description = "주문 ID", example = "1")
	private Integer orderId;

	@Schema(description = "상품명", example = "[가전디지털] 테스트 상품 1")
	private String itemName;

	@Schema(description = "브랜드명", example = "테스트 브랜드 2")
	private String brand;

	@Schema(description = "총 가격", example = "149000")
	private int totalPrice;

	@Schema(description = "주문 상태", example = "결제 완료")
	private String status;

	@Schema(description = "주문 일시", example = "2024-03-18T09:30:00")
	private LocalDateTime orderDate;

	// 일반 구매 응답 필드
	@Schema(description = "구매 수량", example = "1")
	private Integer quantity;

	@Schema(description = "배송 주소", example = "서울특별시 강남구 테헤란로 123")
	private String address;

	// 선물 구매 응답 필드
	@Schema(description = "수령인 이름", example = "김민수")
	private String receiverName;
}
