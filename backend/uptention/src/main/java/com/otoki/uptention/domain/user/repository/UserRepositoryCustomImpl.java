package com.otoki.uptention.domain.user.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.user.dto.UserCursorDto;
import com.otoki.uptention.domain.user.entity.QUser;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserRepositoryCustomImpl implements UserRepositoryCustom {

	private final JPAQueryFactory queryFactory;

	@Override
	public List<User> findUsersByCursor(Company company, UserRole userRole, String keyword,
		UserCursorDto cursor, UserSortType sortType, int size) {
		QUser user = QUser.user;

		// 기본 조건: 소속 Company 및 활성화 상태
		BooleanExpression conditions = user.company.eq(company)
			.and(user.status.isTrue());

		// UserRole 조건: null이면 ROLE_MEMBER, ROLE_TEMP_MEMBER 모두 조회
		if (userRole != null) {
			conditions = conditions.and(user.role.eq(userRole));
		} else {
			conditions = conditions.and(user.role.in(UserRole.ROLE_MEMBER, UserRole.ROLE_TEMP_MEMBER));
		}

		// 키워드 조건 (예: 이름 포함 검색)
		if (keyword != null && !keyword.isEmpty()) {
			conditions = conditions.and(user.name.contains(keyword));
		}

		// 커서 조건 (커서가 존재하면)
		if (cursor != null) {
			conditions = conditions.and(getCursorCondition(user, cursor, sortType));
		}

		return queryFactory
			.selectFrom(user)
			.where(conditions)
			.orderBy(getOrderByExpressions(user, sortType))
			.limit(size)
			.fetch();
	}

	/**
	 * 커서 조건 생성 (정렬 타입에 따라)
	 */
	private BooleanExpression getCursorCondition(QUser user, UserCursorDto cursor, UserSortType sortType) {
		if (sortType == UserSortType.NAMES_DESC) {
			return user.name.lt(cursor.getValue())
				.or(user.name.eq(cursor.getValue()).and(user.id.lt(cursor.getId())));
		} else if (sortType == UserSortType.REGISTER_DATE_ASC) {
			// 문자열로 저장된 날짜를 LocalDateTime으로 파싱하여 비교 (포맷 주의)
			LocalDateTime cursorDate = LocalDateTime.parse(cursor.getValue());
			return user.createdAt.gt(cursorDate)
				.or(user.createdAt.eq(cursorDate).and(user.id.lt(cursor.getId())));
		} else if (sortType == UserSortType.REGISTER_DATE_DESC) {
			LocalDateTime cursorDate = LocalDateTime.parse(cursor.getValue());
			return user.createdAt.lt(cursorDate)
				.or(user.createdAt.eq(cursorDate).and(user.id.lt(cursor.getId())));
		} else {
			throw new CustomException(ErrorCode.USER_INVALID_SORT_TYPE);
		}
	}

	/**
	 * 정렬 표현식 생성 (주 정렬 필드와 보조로 id 사용)
	 */
	private OrderSpecifier<?>[] getOrderByExpressions(QUser user, UserSortType sortType) {
		if (sortType == UserSortType.NAMES_DESC) {
			return new OrderSpecifier<?>[] {user.name.desc(), user.id.desc()};
		} else if (sortType == UserSortType.REGISTER_DATE_ASC) {
			return new OrderSpecifier<?>[] {user.createdAt.asc(), user.id.desc()};
		} else if (sortType == UserSortType.REGISTER_DATE_DESC) {
			return new OrderSpecifier<?>[] {user.createdAt.desc(), user.id.desc()};
		} else {
			throw new CustomException(ErrorCode.USER_INVALID_SORT_TYPE);
		}
	}
}
