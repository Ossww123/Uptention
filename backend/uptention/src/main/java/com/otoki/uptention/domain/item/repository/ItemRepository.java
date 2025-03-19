package com.otoki.uptention.domain.item.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.item.entity.Item;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
}
