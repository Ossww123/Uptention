package com.otoki.uptention.application.mining.service.dto.response;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
@Schema(description = "채굴 시간 조회 응답 DTO")
public class MiningTimeResponseDto {

	@Schema(description = "시작 시간", example = "2024-01-01T08:00:00")
	private LocalDateTime startTime;

	@Schema(description = "시작 시간", example = "2024-01-01T08:00:00")
	private LocalDateTime endTime;

	@Schema(description = "시작 시간", example = "10")
	private Long totalTime;
}
