package com.otoki.uptention.application.order.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiftRequestDto {
	@NotNull(message = "주문 상품 id는 필수입니다.")
	private Integer itemId;

	@NotNull(message = "선물 받는 사용자 id는 필수입니다.")
	private Integer receiverId;
}
