package com.otoki.uptention.domain.order.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.domain.order.enums.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Integer> {


	// 특정 상태의 주문 목록 조회
	List<Order> findByStatus(OrderStatus status);

	// 특정 사용자의 특정 상태 주문 목록 조회
	List<Order> findByUserIdAndStatus(Integer userId, OrderStatus status);

	@Query("SELECT o.address FROM Order o " +
		"LEFT JOIN Gift g ON o.id = g.order.id " +
		"WHERE o.user.id = :userId " +
		"AND g.order.id IS NULL " +
		"ORDER BY o.createdAt DESC " +
		"LIMIT 1")
	String findLatestDeliveryAddressByUserId(@Param("userId") Integer userId);

	// 구매 주문 조회 (첫 페이지)
	@Query("SELECT o FROM Order o " +
		"WHERE o.user.id = :userId " +
		"AND NOT EXISTS (SELECT g FROM Gift g WHERE g.order.id = o.id) " +
		"ORDER BY o.createdAt DESC " +
		"LIMIT :limit")
	List<Order> findPurchaseOrdersByUserIdWithLimit(@Param("userId") Integer userId, @Param("limit") int limit);

	// 구매 주문 조회 (다음 페이지 - 커서 기반)
	@Query("SELECT o FROM Order o " +
		"WHERE o.user.id = :userId " +
		"AND NOT EXISTS (SELECT g FROM Gift g WHERE g.order.id = o.id) " +
		"AND o.id < :orderId " +
		"ORDER BY o.createdAt DESC, o.id DESC " +
		"LIMIT :limit")
	List<Order> findPurchaseOrdersByUserIdAndCursor(
		@Param("userId") Integer userId,
		@Param("orderId") Integer orderId,
		@Param("limit") int limit);

	// 사용자가 선물한 주문 조회 (첫 페이지)
	@Query("SELECT o FROM Order o " +
		"JOIN Gift g ON g.order.id = o.id " +
		"WHERE o.user.id = :userId " + // 선물을 한 사용자(구매자) 기준으로 조회
		"ORDER BY o.createdAt DESC " +
		"LIMIT :limit")
	List<Order> findGiftOrdersByUserIdWithLimit(@Param("userId") Integer userId, @Param("limit") int limit);

	// 사용자가 선물한 주문 조회 (다음 페이지 - 커서 기반)
	@Query("SELECT o FROM Order o " +
		"JOIN Gift g ON g.order.id = o.id " +
		"WHERE o.user.id = :userId " + // 선물을 한 사용자(구매자) 기준으로 조회
		"AND o.id < :orderId " +
		"ORDER BY o.createdAt DESC, o.id DESC " +
		"LIMIT :limit")
	List<Order> findGiftOrdersByUserIdAndCursor(
		@Param("userId") Integer userId,
		@Param("orderId") Integer orderId,
		@Param("limit") int limit);
}
