package com.otoki.uptention.domain.item.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.item.entity.Item;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer>, ItemRepositoryCustom {

	// 상세 조회용 - Item과 연관된 모든 이미지 가져오기
	@Query("SELECT i FROM Item i LEFT JOIN FETCH i.images WHERE i.id = :itemId AND i.status = true")
	Optional<Item> findActiveByIdWithImages(@Param("itemId") Integer itemId);

	// 활성 상태인 모든 상품 조회
	List<Item> findByStatusTrue();
}
