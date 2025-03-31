package com.otoki.uptention.domain.mining.dto.response;

import com.otoki.uptention.domain.user.entity.User;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MiningTimeRankResponseDto {

	private String username;
	private Long totalMiningMinutes;
}
