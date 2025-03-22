package com.otoki.uptention.domain.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.user.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
}
