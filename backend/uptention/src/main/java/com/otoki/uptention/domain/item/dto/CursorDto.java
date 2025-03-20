package com.otoki.uptention.domain.item.dto;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CursorDto {
	private Integer value;  // 정렬 기준값 (판매량 또는 가격)
	private Integer id;     // 아이템 ID

	// 커서 문자열로 변환
	public String encode() {
		try {
			ObjectMapper mapper = new ObjectMapper();
			String json = mapper.writeValueAsString(this);
			return Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
		} catch (JsonProcessingException e) {
			throw new RuntimeException("커서 인코딩 실패", e);
		}
	}

	// 커서 문자열 파싱
	public static CursorDto decode(String cursorStr) {
		try {
			if (cursorStr == null || cursorStr.isEmpty()) {
				return null;
			}
			byte[] decodedBytes = Base64.getDecoder().decode(cursorStr);
			String json = new String(decodedBytes, StandardCharsets.UTF_8);

			ObjectMapper mapper = new ObjectMapper();
			return mapper.readValue(json, CursorDto.class);
		} catch (Exception e) {
			throw new RuntimeException("커서 디코딩 실패", e);
		}
	}
}