package com.otoki.uptention.domain.category.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.domain.category.entity.Category;
import com.otoki.uptention.domain.category.repository.CategoryRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

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

	/**
	 * 카테고리 ID로 카테고리 정보 조회
	 */
	@Override
	public Category getCategoryById(Integer categoryId) {
		return categoryRepository.findById(categoryId)
			.orElseThrow(() -> new CustomException(ErrorCode.ITEM_CATEGORY_NOT_FOUND));
	}

	/**
	 * 모든 카테고리 정보 조회
	 */
	@Override
	public List<Category> getAllCategories() {
		return categoryRepository.findAll();
	}
}
