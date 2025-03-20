package com.otoki.uptention.domain.image.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.image.entity.Image;

@Repository
public interface ImageRepository extends JpaRepository<Image, Integer> {
}
