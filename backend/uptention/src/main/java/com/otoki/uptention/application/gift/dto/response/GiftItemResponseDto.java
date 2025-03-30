package com.otoki.uptention.application.gift.dto.response;

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
@Schema(description = "선물 항목 응답 DTO")
public class GiftItemResponseDto {
	@Schema(description = "선물 ID", example = "1")
	private Integer giftId;

	@Schema(description = "주문 ID", example = "1")
	private Integer orderId;

	@Schema(description = "상품명", example = "무선 이어폰")
	private String itemName;

	@Schema(description = "상품 브랜드", example = "Samsung")
	private String brand;

	@Schema(description = "선물 상태", example = "수령 대기")
	private String status;

	@Schema(description = "선물 받은 날짜")
	private LocalDateTime receivedDate;

	@Schema(description = "선물 이미지 URL", example = "https://example.com/image.jpg")
	private String imageUrl;

	@Schema(description = "보낸 사람 ID", example = "1")
	private Integer senderId;

	@Schema(description = "보낸 사람 이름", example = "홍길동")
	private String senderName;

}
