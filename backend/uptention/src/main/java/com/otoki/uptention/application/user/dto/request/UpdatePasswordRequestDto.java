package com.otoki.uptention.application.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePasswordRequestDto {

	@Schema(description = "현재 비밀번호", example = "password12!")
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*]{8,15}$",
		message = "로그인 비밀번호는 영문과 숫자를 반드시 포함하고, 특수문자(!@#$%^&*)를 사용할 수 있으며 8자 이상 15자 이하여야 합니다.")
	private String currentPassword;

	@Schema(description = "새 비밀번호", example = "abc1234!")
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*]{8,15}$",
		message = "로그인 비밀번호는 영문과 숫자를 반드시 포함하고, 특수문자(!@#$%^&*)를 사용할 수 있으며 8자 이상 15자 이하여야 합니다.")
	private String newPassword;
}