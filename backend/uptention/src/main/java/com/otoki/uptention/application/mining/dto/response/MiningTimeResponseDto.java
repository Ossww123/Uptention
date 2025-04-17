package com.otoki.uptention.application.mining.dto.response;

import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
@Schema(description = "스크린타임 조회 응답 DTO")
public class MiningTimeResponseDto {

	@Schema(description = "시작 시간", example = "2024-01-01")
	private LocalDate date;

	@Schema(description = "총 시간(분)", example = "10")
	private Integer totalTime;
}
