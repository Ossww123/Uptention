package com.otoki.uptention.domain.user.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.user.entity.FcmToken;
import com.otoki.uptention.domain.user.entity.User;

@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, Integer> {
	@Modifying(clearAutomatically = true)
	@Query("delete from FcmToken f where f.user = :user and f.value = :value")
	void deleteByUserAndValue(@Param("user") User user, @Param("value") String value);

	// User의 모든 FcmToken 조회
	List<FcmToken> findAllByUser(User user);
}
