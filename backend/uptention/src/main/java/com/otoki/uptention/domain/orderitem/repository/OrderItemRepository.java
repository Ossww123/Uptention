package com.otoki.uptention.domain.orderitem.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.orderitem.entity.OrderItem;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

	@Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order o WHERE o.id = :orderId AND oi.id = :orderItemId")
	Optional<OrderItem> findByIdAndOrderId(@Param("orderItemId") Integer orderItemId,
		@Param("orderId") Integer orderId);

	@Query("SELECT oi FROM OrderItem oi " +
		"JOIN FETCH oi.item " +
		"JOIN FETCH oi.order " +
		"WHERE oi.order.id IN :orderIds " +
		"ORDER BY oi.order.createdAt DESC, oi.order.id DESC")
	List<OrderItem> findAllByOrderIdInWithItemJoin(@Param("orderIds") List<Integer> orderIds);
}
