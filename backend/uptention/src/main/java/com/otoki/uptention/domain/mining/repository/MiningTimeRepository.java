package com.otoki.uptention.domain.mining.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.user.entity.User;

@Repository
public interface MiningTimeRepository extends JpaRepository<MiningTime, Integer> {
	Optional<MiningTime> findTopByUserOrderByStartTimeDesc(User user);

}
