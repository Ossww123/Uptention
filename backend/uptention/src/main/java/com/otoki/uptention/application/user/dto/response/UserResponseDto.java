package com.otoki.uptention.application.user.dto.response;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class UserResponseDto {
	@Schema(description = "유저 id")
	private Integer userId;

	@Schema(description = "로그인 id")
	private String username;

	@Schema(description = "이름")
	private String name;

	@Schema(description = "사번")
	private String employeeNumber;

	@Schema(description = "지갑 주소")
	private String wallet;

	@Schema(description = "프로필 이미지 URL")
	private String profileImage;

	@Schema(description = "유저 ROLE")
	private String role;

	@Schema(description = "가입일")
	private LocalDateTime createdAt;
}
