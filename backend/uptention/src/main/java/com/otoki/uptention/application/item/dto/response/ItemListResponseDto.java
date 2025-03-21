package com.otoki.uptention.application.item.dto.response;

import java.util.List;

import com.otoki.uptention.domain.item.dto.ItemDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class ItemListResponseDto {
	private List<ItemDto> items;
	private boolean hasNextPage;
	private String nextCursor;
}
