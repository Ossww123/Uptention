package com.otoki.uptention.application.item.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.item.dto.response.CategoryResponseDto;
import com.otoki.uptention.domain.category.entity.Category;
import com.otoki.uptention.domain.category.service.CategoryService;

import lombok.RequiredArgsConstructor;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class CategoryAppServiceImpl implements CategoryAppService {

	private final CategoryService categoryService;

	@Override
	public List<CategoryResponseDto> getAllCategories() {
		List<Category> categories = categoryService.getAllCategories();
		return categories.stream()
			.map(this::mapToCategoryResponseDto)
			.collect(Collectors.toList());
	}

	private CategoryResponseDto mapToCategoryResponseDto(Category category) {
		return CategoryResponseDto.builder()
			.categoryId(category.getId())
			.name(category.getName())
			.build();
	}
}
