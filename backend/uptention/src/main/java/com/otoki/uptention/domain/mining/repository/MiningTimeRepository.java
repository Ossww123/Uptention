package com.otoki.uptention.domain.mining.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.mining.entity.MiningTime;

@Repository
public interface MiningTimeRepository extends JpaRepository<MiningTime, Integer> {
}
