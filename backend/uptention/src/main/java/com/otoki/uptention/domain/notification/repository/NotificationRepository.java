package com.otoki.uptention.domain.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.notification.entity.Notification;
import com.otoki.uptention.domain.user.entity.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer>, NotificationRepositoryCustom {
	// 유저의 읽지 않은 알림을 모두 읽음 처리
	@Modifying
	@Query("UPDATE Notification n SET n.read = true WHERE n.user = :user AND n.read = false")
	void markAllAsReadByUser(@Param("user") User user);
}
