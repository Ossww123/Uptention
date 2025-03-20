package com.otoki.uptention.application.item.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.otoki.uptention.domain.image.entity.Image;
import com.otoki.uptention.domain.item.entity.Item;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ItemResponseDto {
	private final Integer itemId;
	private final String name;
	private final String detail;
	private final Integer price;
	private final String brand;
	private final Integer categoryId;
	private final String categoryName;
	private final List<String> images;
	private final LocalDateTime createdAt;

	public static ItemResponseDto from(Item item, List<Image> imageList) {
		return ItemResponseDto.builder()
			.itemId(item.getId())
			.name(item.getName())
			.detail(item.getDetail())
			.price(item.getPrice())
			.brand(item.getBrand())
			.categoryId(item.getCategory().getId())
			.categoryName(item.getCategory().getName())
			.images(imageList.stream()
				.map(Image::getUrl)
				.collect(Collectors.toList()))
			.createdAt(item.getCreatedAt())
			.build();
	}
}

