package com.otoki.uptention.domain.category.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.category.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

	private final CategoryRepository categoryRepository;

	/**
	 * 카테고리 ID로 카테고리 존재 여부 확인
	 */
	@Override
	public boolean isCategoryExists(Integer categoryId) {
		return categoryRepository.existsById(categoryId);
	}
}
