package com.otoki.uptention.domain.cart.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.domain.cart.entity.Cart;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {
	Cart findByUserIdAndItemId(Integer userId, Integer itemId);

	/**
	 * 특정 사용자의 모든 장바구니 항목 중 활성화된(status=true) 상품과 해당 상품의 첫 번째 이미지(썸네일)를 함께 조회
	 */
	@Query("SELECT new com.otoki.uptention.domain.cart.dto.CartItemDto(" +
		"c.id, " +
		"i.id, " +
		"i.name, " +
		"i.price, " +
		"i.brand, " +
		"c.quantity, " +
		"i.price * c.quantity, " +
		"i.quantity, " +
		"(SELECT img.url FROM Image img WHERE img.item = i AND img.id = " +
		"(SELECT MIN(subImg.id) FROM Image subImg WHERE subImg.item = i))) " +
		"FROM Cart c JOIN c.item i " +
		"WHERE c.user.id = :userId AND i.status = true " +
		"ORDER BY c.createdAt DESC")
	List<CartItemDto> findCartItemsWithThumbnailByUserId(@Param("userId") Integer userId);

	/**
	 * 특정 사용자의 장바구니에 담긴 상품 종류의 개수를 조회
	 */
	@Query("SELECT COUNT(c) FROM Cart c WHERE c.user.id = :userId")
	Integer countCartItemsByUserId(@Param("userId") Integer userId);

}
