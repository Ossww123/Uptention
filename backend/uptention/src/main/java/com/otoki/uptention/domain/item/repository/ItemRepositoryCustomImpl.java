package com.otoki.uptention.domain.item.repository;

import java.util.List;

import com.otoki.uptention.domain.image.entity.QImage;
import com.otoki.uptention.domain.item.dto.CursorDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.QItem;
import com.otoki.uptention.domain.item.enums.SortType;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ItemRepositoryCustomImpl implements ItemRepositoryCustom {

	private final JPAQueryFactory queryFactory;

	@Override
	public List<ItemDto> findItemsByCursor(Integer categoryId, String keyword, CursorDto cursor, SortType sortType,
		int size) {
		QItem item = QItem.item;
		QImage image = QImage.image;
		QImage subImage = new QImage("subImage");

		// 기본 조건과 커서 조건 결합
		BooleanExpression conditions = getBaseConditions(item, categoryId, keyword);
		if (cursor != null) {
			conditions = conditions.and(getCursorCondition(item, cursor, sortType));
		}

		// ID 순서대로 첫 이미지 가져오기 (최적화된 서브쿼리)
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
			.select(Projections.fields(ItemDto.class,
				item.id.as("itemId"),
				item.name,
				item.price,
				item.brand,
				item.salesCount,
				ExpressionUtils.as(thumbnailSubquery, "thumbnail")
			))
			.from(item)
			.where(conditions)
			.orderBy(getOrderByExpression(item, sortType))
			.limit(size)
			.fetch();
	}

	/**
	 * 기본 검색 조건을 생성합니다.
	 */
	private BooleanExpression getBaseConditions(QItem item, Integer categoryId, String keyword) {
		BooleanExpression conditions = item.status.isTrue();

		if (categoryId != null) {
			conditions = conditions.and(item.category.id.eq(categoryId));
		}

		if (keyword != null && !keyword.isEmpty()) {
			conditions = conditions.and(item.name.contains(keyword));
		}

		return conditions;
	}

	/**
	 * 커서 기반 페이징을 위한 조건을 생성합니다.
	 */
	private BooleanExpression getCursorCondition(QItem item, CursorDto cursor, SortType sortType) {
		return switch (sortType) {
			case LOW_PRICE -> item.price.gt(cursor.getValue())
				.or(item.price.eq(cursor.getValue()).and(item.id.lt(cursor.getId())));
			case HIGH_PRICE -> item.price.lt(cursor.getValue())
				.or(item.price.eq(cursor.getValue()).and(item.id.lt(cursor.getId())));
			case SALES, default -> item.salesCount.lt(cursor.getValue())
				.or(item.salesCount.eq(cursor.getValue()).and(item.id.lt(cursor.getId())));
		};
	}

	/**
	 * 정렬 표현식을 가져옵니다.
	 */
	private com.querydsl.core.types.OrderSpecifier<?>[] getOrderByExpression(QItem item, SortType sortType) {
		return switch (sortType) {
			case LOW_PRICE -> new com.querydsl.core.types.OrderSpecifier<?>[] {
				item.price.asc(),
				item.id.desc()
			};
			case HIGH_PRICE -> new com.querydsl.core.types.OrderSpecifier<?>[] {
				item.price.desc(),
				item.id.desc()
			};
			case SALES, default -> new com.querydsl.core.types.OrderSpecifier<?>[] {
				item.salesCount.desc(),
				item.id.desc()
			};
		};
	}
}