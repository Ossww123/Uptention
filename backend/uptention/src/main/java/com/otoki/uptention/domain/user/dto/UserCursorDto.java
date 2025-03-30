package com.otoki.uptention.domain.user.dto;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserCursorDto {
	// 정렬 기준 값 (이름 혹은 가입일 문자열)
	private String value;
	private Integer id;

	public String encode() {
		try {
			ObjectMapper mapper = new ObjectMapper();
			String json = mapper.writeValueAsString(this);
			return Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
		} catch (JsonProcessingException e) {
			throw new CustomException(ErrorCode.CURSOR_ENCODING_FAILED);
		}
	}

	public static UserCursorDto decode(String cursorStr) {
		try {
			if (cursorStr == null || cursorStr.isEmpty()) {
				return null;
			}
			byte[] decodedBytes = Base64.getDecoder().decode(cursorStr);
			String json = new String(decodedBytes, StandardCharsets.UTF_8);
			ObjectMapper mapper = new ObjectMapper();
			return mapper.readValue(json, UserCursorDto.class);
		} catch (Exception e) {
			throw new CustomException(ErrorCode.CURSOR_DECODING_FAILED);
		}
	}
}
