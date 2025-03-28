package com.otoki.uptention.auth.service;

import jakarta.servlet.http.HttpServletResponse;

public interface TokenAppService {
	void issueToken(HttpServletResponse response, Integer userId, String role);
}
