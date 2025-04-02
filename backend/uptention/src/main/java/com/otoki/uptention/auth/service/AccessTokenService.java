package com.otoki.uptention.auth.service;

import jakarta.servlet.http.HttpServletResponse;

public interface TokenService {
	void issueToken(HttpServletResponse response, Integer userId, String role);
}
