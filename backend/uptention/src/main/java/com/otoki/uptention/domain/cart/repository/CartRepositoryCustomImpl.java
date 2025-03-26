package com.otoki.uptention.domain.cart.repository;

import java.util.List;

import com.otoki.uptention.domain.cart.dto.CartItemDto;
import com.otoki.uptention.domain.cart.entity.QCart;
import com.otoki.uptention.domain.image.entity.QImage;
import com.otoki.uptention.domain.item.entity.QItem;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class CartRepositoryCustomImpl implements CartRepositoryCustom {

	private final JPAQueryFactory queryFactory;

	/**
	 * 특정 사용자의 모든 장바구니 항목 중 활성화된(status=true) 상품만 조회한다.
	 */
	@Override
	public List<CartItemDto> findCartItemsByUserId(Integer userId) {
		QCart cart = QCart.cart;
		QItem item = QItem.item;
		QImage image = QImage.image;
		QImage subImage = new QImage("subImage");

		// 각 상품의 첫 번째 이미지 URL을 가져오는 서브쿼리
		var thumbnailSubquery = JPAExpressions
			.select(image.url)
			.from(image)
			.where(image.item.eq(item)
				.and(image.id.eq(
					JPAExpressions
						.select(subImage.id.min())
						.from(subImage)
						.where(subImage.item.eq(item))
				)));

		return queryFactory
			.select(Projections.fields(CartItemDto.class,
					cart.id.as("cartId"),  // 장바구니 ID 추가
					item.id.as("itemId"),
					item.name,
					item.price,
					item.brand,
					cart.quantity,
					item.price.multiply(cart.quantity).as("totalPrice"),
					item.quantity.as("stockQuantity"),
					ExpressionUtils.as(thumbnailSubquery, "thumbnail")
				)
			)
			.from(cart)
			.join(cart.item, item)
			.where(cart.user.id.eq(userId)
				.and(item.status.isTrue()))
			.orderBy(cart.createdAt.desc()) // 최근 담은 순으로 정렬
			.fetch();
	}

	/**
	 * 특정 사용자의 장바구니 중에서 지정된 ID 목록에 해당하는 항목만 조회
	 */
	@Override
	public List<CartItemDto> findCartItemsByIds(Integer userId, List<Integer> cartIds) {
		if (cartIds == null || cartIds.isEmpty()) {
			return List.of();
		}

		QCart cart = QCart.cart;
		QItem item = QItem.item;
		QImage image = QImage.image;
		QImage subImage = new QImage("subImage");

		// 각 상품의 첫 번째 이미지 URL을 가져오는 서브쿼리
		var thumbnailSubquery = JPAExpressions
			.select(image.url)
			.from(image)
			.where(image.item.eq(item)
				.and(image.id.eq(
					JPAExpressions
						.select(subImage.id.min())
						.from(subImage)
						.where(subImage.item.eq(item))
				)));

		return queryFactory
			.select(Projections.fields(CartItemDto.class,
					cart.id.as("cartId"),  // 장바구니 ID 추가
					item.id.as("itemId"),
					item.name,
					item.price,
					item.brand,
					cart.quantity,
					item.price.multiply(cart.quantity).as("totalPrice"),
					item.quantity.as("stockQuantity"),
					ExpressionUtils.as(thumbnailSubquery, "thumbnail")
				)
			)
			.from(cart)
			.join(cart.item, item)
			.where(cart.user.id.eq(userId)
				.and(cart.id.in(cartIds)))
			.orderBy(cart.createdAt.desc())
			.fetch();
	}
}