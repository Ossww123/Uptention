package com.otoki.uptention.domain.order.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.order.dto.GiftItemDto;
import com.otoki.uptention.domain.order.entity.Gift;
import com.otoki.uptention.domain.order.enums.GiftStatus;

@Repository
public interface GiftRepository extends JpaRepository<Gift, Integer> {

	// 특정 사용자가 받은 선물 목록 조회 (첫 페이지)
	@Query("SELECT new com.otoki.uptention.domain.order.dto.GiftItemDto(" +
		"g.id, " +
		"o.id, " +
		"oi.item.name, " +
		"oi.itemPrice, " +
		"oi.item.brand, " +
		"g.status, " +
		"g.createdAt, " +
		"(SELECT img.url FROM Image img WHERE img.item = oi.item AND img.id = " +
		"(SELECT MIN(subImg.id) FROM Image subImg WHERE subImg.item = oi.item)), " +
		"o.user.id, " +
		"o.user.name) " +
		"FROM Gift g " +
		"JOIN g.order o " +
		"JOIN OrderItem oi ON oi.order = o " +
		"WHERE g.receiver.id = :userId " +
		"AND g.status = :status " +
		"ORDER BY g.createdAt DESC " +
		"LIMIT :limit")
	List<GiftItemDto> findReceivedGiftsByUserIdAndStatusWithLimit(
		@Param("userId") Integer userId,
		@Param("status") GiftStatus status,
		@Param("limit") int limit);

	// 특정 사용자가 받은 선물 목록 조회 (다음 페이지 - 커서 기반)
	@Query("SELECT new com.otoki.uptention.domain.order.dto.GiftItemDto(" +
		"g.id, " +
		"o.id, " +
		"oi.item.name, " +
		"oi.itemPrice, " +
		"oi.item.brand, " +
		"g.status, " +
		"g.createdAt, " +
		"(SELECT img.url FROM Image img WHERE img.item = oi.item AND img.id = " +
		"(SELECT MIN(subImg.id) FROM Image subImg WHERE subImg.item = oi.item)), " +
		"o.user.id, " +
		"o.user.name) " +
		"FROM Gift g " +
		"JOIN g.order o " +
		"JOIN OrderItem oi ON oi.order = o " +
		"WHERE g.receiver.id = :userId " +
		"AND g.status = :status " +
		"AND g.id < :giftId " +
		"ORDER BY g.createdAt DESC, g.id DESC " +
		"LIMIT :limit")
	List<GiftItemDto> findReceivedGiftsByUserIdAndStatusAndCursor(
		@Param("userId") Integer userId,
		@Param("status") GiftStatus status,
		@Param("giftId") Integer giftId,
		@Param("limit") int limit);
}