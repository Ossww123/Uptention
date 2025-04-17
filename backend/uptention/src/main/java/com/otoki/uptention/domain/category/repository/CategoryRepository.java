package com.otoki.uptention.domain.category.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.category.entity.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
}
