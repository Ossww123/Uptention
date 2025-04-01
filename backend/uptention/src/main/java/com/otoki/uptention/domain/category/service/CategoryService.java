package com.otoki.uptention.domain.category.service;

import java.util.List;

import com.otoki.uptention.domain.category.entity.Category;

public interface CategoryService {
	boolean isCategoryExists(Integer categoryId);

	List<Category> getAllCategories();
}
