package com.otoki.uptention.application.example.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RegisterExampleRequestDto {
	@Schema(description = "예제 id", example = "3")
	private Integer exampleId;

	@Schema(description = "이름", example = "대성")
	@Size(max = 10, message = "이름은  10자 이하여야 합니다.")
	private String exampleName;
}
