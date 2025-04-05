package com.otoki.uptention.domain.notification.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.notification.entity.QNotification;
import com.otoki.uptention.domain.user.dto.UserCursorDto;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class NotificationRepositoryCustomImpl implements NotificationRepositoryCustom {

	private final JPAQueryFactory queryFactory;

	@Override
	public List<Notification> findNotificationsByCursor(User user, Boolean read, String keyword,
		UserCursorDto<String> cursor, int size) {
		QNotification notification = QNotification.notification;

		// 기본 조건: 요청한 사용자에게 속한 알림
		BooleanExpression conditions = notification.user.eq(user);

		// 읽음 여부 조건 적용 (null이면 전체 조회)
		if (read != null) {
			conditions = conditions.and(notification.read.eq(read));
		}

		// 키워드 조건 (제목이나 메시지에 키워드 포함)
		if (keyword != null && !keyword.isEmpty()) {
			conditions = conditions.and(
				notification.title.contains(keyword)
					.or(notification.message.contains(keyword))
			);
		}

		// 커서 조건 (커서가 존재하면)
		if (cursor != null) {
			conditions = conditions.and(getCursorCondition(notification, cursor));
		}

		return queryFactory
			.selectFrom(notification)
			.where(conditions)
			.orderBy(getOrderByExpressions(notification))
			.limit(size)
			.fetch();
	}

	/**
	 * 커서 조건 생성 (생성일 최신순)
	 */
	private BooleanExpression getCursorCondition(QNotification notification, UserCursorDto<String> cursor) {
		try {
			LocalDateTime cursorDate = LocalDateTime.parse(cursor.getValue());
			return notification.createdAt.lt(cursorDate)
				.or(notification.createdAt.eq(cursorDate).and(notification.id.lt(cursor.getId())));
		} catch (Exception e) {
			throw new CustomException(ErrorCode.CURSOR_DECODING_FAILED);
		}
	}

	/**
	 * 정렬 표현식 생성 (생성일 최신순과 ID 내림차순)
	 */
	private OrderSpecifier<?>[] getOrderByExpressions(QNotification notification) {
		return new OrderSpecifier<?>[] {notification.createdAt.desc(), notification.id.desc()};
	}
}