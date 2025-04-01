package com.otoki.uptention.application.item.service;

import java.util.List;

import com.otoki.uptention.application.item.dto.response.CategoryResponseDto;

public interface CategoryAppService {

	List<CategoryResponseDto> getAllCategories();
}
