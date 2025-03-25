package com.otoki.uptention.application.order.dto.response;

import java.util.List;

import com.otoki.uptention.domain.item.dto.ItemDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderVerificationResponseDto {
	private List<ItemDto> items;
}