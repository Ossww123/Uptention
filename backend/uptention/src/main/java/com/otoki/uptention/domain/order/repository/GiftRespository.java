package com.otoki.uptention.domain.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.order.entity.Gift;

@Repository
public interface GiftRespository extends JpaRepository<Gift, Integer> {
}
