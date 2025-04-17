package com.otoki.uptention.domain.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.enums.UserRole;

@Repository
public interface UserRepository extends JpaRepository<User, Integer>, UserRepositoryCustom {
	// username 중복 여부 확인
	boolean existsByUsername(String username);

	// 사번 중복 여부 확인
	boolean existsByEmployeeNumber(String employeeNumber);

	// 로그인 아이디로 User 불러오기
	Optional<User> findByUsername(String username);

	// Id와 회사 정보로 User 불러오기
	Optional<User> findByIdAndCompany(Integer id, Company company);

	List<User> findAllByRoleAndPointIsAfter(UserRole role, Integer point);
}
