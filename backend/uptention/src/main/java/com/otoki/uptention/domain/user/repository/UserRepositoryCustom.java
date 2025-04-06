package com.otoki.uptention.domain.user.repository;

import java.util.List;

import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;

public interface UserRepositoryCustom {
	List<User> findUsersByCursor(Company company, UserRole userRole, String keyword,
		CursorDto<String> cursor, UserSortType sortType, int size);
}
