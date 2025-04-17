package com.otoki.uptention.auth.dto;

import com.otoki.uptention.domain.user.enums.UserRole;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class UserDetailsDto {
	private Integer userId;
	private String username;
	private String password;
	private UserRole role;
}
