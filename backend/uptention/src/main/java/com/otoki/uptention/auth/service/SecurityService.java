package com.otoki.uptention.auth.service;

import com.otoki.uptention.domain.user.entity.User;

public interface SecurityService {
	boolean isLoggedIn();

	User getLoggedInUser();
}
