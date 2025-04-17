package com.otoki.uptention.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequestDto {
	@Schema(description = "로그인 아이디", example = "uptention1234")
	private String username;

	@Schema(description = "로그인 비밀번호", example = "uptention1234")
	private String password;

	@Schema(description = "로그인 타입 (허용값: member, admin)", allowableValues = {"member", "admin"})
	private String loginType;
}