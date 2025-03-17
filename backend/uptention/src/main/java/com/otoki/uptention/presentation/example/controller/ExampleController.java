package com.otoki.uptention.presentation.example.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.otoki.uptention.application.example.dto.request.RegisterExampleRequestDto;
import com.otoki.uptention.application.example.dto.response.ExampleResponseDto;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;

@RestController
public class ExampleController {

	@Operation(summary = "예제 조회", description = "예제를 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "정상 처리"),
	})
	@GetMapping("/api/example")
	public ResponseEntity<ExampleResponseDto> getExample() {
		ExampleResponseDto exampleGetResponseDto = ExampleResponseDto.builder()
			.exampleId(2)
			.exampleName("exampleName")
			.build();

		return ResponseEntity.ok(exampleGetResponseDto);
	}

	@Operation(summary = "예제 등록", description = "예제를 등록합니다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "정상 처리"),
		@ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없습니다."),
	})
	@PostMapping("/api/example")
	public ResponseEntity<String> postExample(@RequestBody @Valid RegisterExampleRequestDto examplePostRequestDto) {

		if (examplePostRequestDto.getExampleName().equals("correct")) {
			throw new CustomException(ErrorCode.INVALID_PARAMETER);
		}

		return ResponseEntity.ok().body("성공");
	}
}

