package com.otoki.uptention.application.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
@Schema(description = "회원가입 DTO")
public class JoinRequestDto {
	@Schema(description = "로그인 아이디", example = "user2023")
	@Pattern(regexp = "^[a-z0-9]{8,15}$",
		message = "로그인 아이디는 소문자와 숫자만 사용가능하고 8자 이상 15자 이하여야 합니다.")
	private String username;

	@Schema(description = "로그인 비밀번호", example = "password12!")
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,15}$",
		message = "로그인 비밀번호는 영문과 숫자를 반드시 포함하여 8자 이상 15자 이하여야 합니다.")
	private String password;

	@Schema(description = "유저이름", example = "조대성")
	@Size(min = 2, max = 20,
		message = "유저이름은 2자 이상 20자 이하여야 합니다.")
	private String name;

	@Schema(description = "사번", example = "A012341738261")
	@Pattern(regexp = "^[A-Za-z0-9]{1,20}$",
		message = "사번은 영어와 숫자만 사용가능하며 1자 이상 20자 이하여야 합니다.")
	private String employeeNumber;
}
