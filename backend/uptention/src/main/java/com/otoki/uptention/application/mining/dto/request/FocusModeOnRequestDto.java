package com.otoki.uptention.application.mining.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "집중모드 on 요청 DTO")
public class FocusModeOnRequestDto {

	@Schema(description = "위도", example = "37.5139")
	private Float latitude;

	@Schema(description = "경도", example = "127.057")
	private Float longitude;
}
