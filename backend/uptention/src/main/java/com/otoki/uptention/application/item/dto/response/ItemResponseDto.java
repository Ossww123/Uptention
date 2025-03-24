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
	private Integer itemId;
	private String name;
	private String detail;
	private Integer price;
	private String brand;
	private int quantity;
	private Integer categoryId;
	private String categoryName;
	private List<String> images;
	private LocalDateTime createdAt;

	public static ItemResponseDto from(Item item, List<Image> imageList) {
		return ItemResponseDto.builder()
			.itemId(item.getId())
			.name(item.getName())
			.detail(item.getDetail())
			.price(item.getPrice())
			.brand(item.getBrand())
			.quantity(item.getQuantity())
			.categoryId(item.getCategory().getId())
			.categoryName(item.getCategory().getName())
			.images(imageList.stream()
				.map(Image::getUrl)
				.collect(Collectors.toList()))
			.createdAt(item.getCreatedAt())
			.build();
	}
}

