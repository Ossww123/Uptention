package com.otoki.uptention.domain.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.example.entity.Example;

@Repository
public interface ExampleRepository extends JpaRepository<Example, Integer> {
}
