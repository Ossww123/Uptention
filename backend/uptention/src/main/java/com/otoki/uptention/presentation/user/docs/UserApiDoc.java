package com.otoki.uptention.presentation.user.docs;

import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.RequestBody;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "유저 관련 API", description = "유저 관련 API")
public interface UserApiDoc {

	@Operation(summary = "회원가입", description = "신규 사용자를 회원가입 처리합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "회원가입 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "회원가입 성공")
				}
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "잘못된 요청",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "유효성 검증 실패",
						summary = "요청 파라미터 오류",
						value = "{\"code\":\"X002\",\"message\":\"[username] 필수 값 누락\",\"path\":\"/api/users\"}"
					)
				}
			)
		),

		@ApiResponse(
			responseCode = "409",
			description = "중복된 아이디 또는 사번",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "중복된 아이디",
						summary = "아이디가 이미 사용중입니다.",
						value = "{\"code\":\"AUTH_006\",\"message\":\"아이디가 이미 사용중입니다.\",\"path\":\"/api/users\"}"
					),
					@ExampleObject(
						name = "중복된 사번",
						summary = "사번이 이미 사용 중입니다.",
						value = "{\"code\":\"AUTH_005\",\"message\":\"사번이 이미 사용 중입니다.\",\"path\":\"/api/users\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> joinUser(@RequestBody JoinRequestDto requestDto);
}
