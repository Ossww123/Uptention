package com.otoki.uptention.domain.mining.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.user.entity.User;

@Repository
public interface MiningTimeRepository extends JpaRepository<MiningTime, Integer> {
	Optional<MiningTime> findTopByUserOrderByStartTimeDesc(User user);

	@Modifying(clearAutomatically = true)
	@Query("UPDATE MiningTime m SET m.endTime = :endTime WHERE m.endTime IS NULL")
	int updateEndTimeForUnfinishedMining(@Param("endTime") LocalDateTime endTime);

}
