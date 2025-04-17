package com.otoki.uptention.application.order.dto.response;

import java.time.LocalDateTime;

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
@Schema(description = "주문 항목 응답 DTO")
public class OrderItemResponseDto {
	@Schema(description = "주문 항목 ID", example = "1")
	private Integer orderItemId;

	@Schema(description = "주문 ID", example = "1")
	private Integer orderId;

	@Schema(description = "상품명", example = "무선 이어폰")
	private String itemName;

	@Schema(description = "수량", example = "2")
	private Integer quantity;

	@Schema(description = "상품 단가", example = "15000")
	private Integer itemPrice;

	@Schema(description = "항목별 총 가격", example = "30000")
	private Integer totalPrice;

	@Schema(description = "주문 상태", example = "결제 완료")
	private String status;

	@Schema(description = "주문 날짜")
	private LocalDateTime orderDate;

}
