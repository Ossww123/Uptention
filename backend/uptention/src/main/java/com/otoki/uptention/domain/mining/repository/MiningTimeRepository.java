package com.otoki.uptention.domain.mining.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;
import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.user.entity.User;

@Repository
public interface MiningTimeRepository extends JpaRepository<MiningTime, Integer> {
	Optional<MiningTime> findTopByUserOrderByStartTimeDesc(User user);

	@Modifying(clearAutomatically = true)
	@Query("UPDATE MiningTime m SET m.endTime = :endTime WHERE m.endTime IS NULL")
	int updateEndTimeForUnfinishedMining(@Param("endTime") LocalDateTime endTime);

	@Modifying(clearAutomatically = true)
	@Query(value = "UPDATE `user` u " +
		"JOIN ( " +
		"    SELECT user_id, ROUND(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) / 10) AS additional_points " +
		"    FROM mining_time " +
		"    WHERE start_time > DATE_SUB(:inspectionTime, INTERVAL 1 DAY) " +
		"    GROUP BY user_id " +
		") m ON u.id = m.user_id " +
		"SET u.point = u.point + LEAST(m.additional_points, 8)", nativeQuery = true)
	int updateUserPoints(@Param("inspectionTime") LocalDateTime specifiedTime);


	@Query("SELECT m FROM MiningTime m WHERE m.user.id = :userId AND m.startTime >= :startTime AND m.endTime <= :endTime")
	List<MiningTime> findMiningTimesByUserIdAndTimeRange(
		@Param("userId") Integer userId,
		@Param("startTime") LocalDateTime startTime,
		@Param("endTime") LocalDateTime endTime
	);

	@Query(value = "SELECT u.name, " +
		"       CAST(SUM(TIMESTAMPDIFF(MINUTE, m.start_time, m.end_time)) AS SIGNED) AS totalMinutes " +
		"FROM mining_time m " +
		"JOIN user u ON m.user_id = u.id " +
		"WHERE m.start_time >= :startTime " +
		"  AND m.end_time <= :endTime " +
		"GROUP BY u.id " +
		"ORDER BY totalMinutes DESC", nativeQuery = true)
	List<MiningTimeRankResponseDto> findMiningTimeRanking(
		@Param("startTime") LocalDateTime startTime,
		@Param("endTime") LocalDateTime endTime
	);




}
