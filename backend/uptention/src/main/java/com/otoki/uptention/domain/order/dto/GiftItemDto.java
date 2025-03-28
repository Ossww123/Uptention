package com.otoki.uptention.domain.order.dto;

import java.time.LocalDateTime;

import com.otoki.uptention.domain.order.enums.GiftStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GiftItemDto {
	private Integer giftId;
	private Integer orderId;
	private String itemName;
	private Integer itemPrice;
	private String brand;
	private GiftStatus status;
	private LocalDateTime receivedDate;
	private String imageUrl;
	private Integer senderId;
	private String senderName;
}