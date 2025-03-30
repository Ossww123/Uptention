package com.otoki.uptention.application.mining.service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
@Schema(description = "포인트 조회 응답 DTO")
public class PointResponseDto {

	@Schema(description = "포인트 값", example = "100")
	private Integer point;
}
