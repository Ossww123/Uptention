package com.otoki.uptention.application.mining.service.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
@Schema(description = "집중모드 on 요청 DTO")
public class FocusModeOnRequestDto {

	@Schema(description = "위도", example = "37.5139")
	private float latitude;

	@Schema(description = "경도", example = "127.057")
	private float longitude;
}
