package com.otoki.uptention.domain.mining.dto.response;

import com.otoki.uptention.domain.user.entity.User;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Schema(description = "우수 사원 랭킹 조회 응답 DTO")
public class MiningTimeRankResponseDto {

	@Schema(description = "유저 아이디", example = "1")
	private Integer id;

	@Schema(description = "사원명", example = "홍길동")
	private String username;

	@Schema(description = "누적 포인트 값(분기준)", example = "103")
	private Long totalMiningMinutes;
}
