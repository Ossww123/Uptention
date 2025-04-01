package com.otoki.uptention.presentation.item.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.item.dto.response.CategoryResponseDto;
import com.otoki.uptention.application.item.service.CategoryAppService;
import com.otoki.uptention.presentation.item.doc.CategoryApiDoc;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/category")
@RequiredArgsConstructor
public class CategoryController implements CategoryApiDoc {

	private final CategoryAppService categoryAppService;

	@GetMapping("")
	public ResponseEntity<List<CategoryResponseDto>> getAllCategories() {
		return ResponseEntity.ok(categoryAppService.getAllCategories());
	}
}
