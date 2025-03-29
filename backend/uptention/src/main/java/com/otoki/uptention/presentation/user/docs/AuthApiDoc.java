package com.otoki.uptention.presentation.user.docs;

import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.auth.dto.LoginRequestDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "인증, 인가 관련 API", description = "인증, 인가 관련 API")
public interface AuthApiDoc {

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
						summary = "요청 파라미터 오류",
						value = "{\"code\":\"X002\",\"message\":\"[username] 필수 값 누락\",\"path\":\"/api/join\"}"
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
						value = "{\"code\":\"AUTH_006\",\"message\":\"아이디가 이미 사용중입니다.\",\"path\":\"/api/join\"}"
					),
					@ExampleObject(
						name = "중복된 사번",
						summary = "사번이 이미 사용 중입니다.",
						value = "{\"code\":\"AUTH_005\",\"message\":\"사번이 이미 사용 중입니다.\",\"path\":\"/api/join\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> joinUser(@RequestBody JoinRequestDto requestDto);

	@Operation(summary = "아이디 중복 검사",
		description = "입력한 username의 중복 여부를 확인합니다. 중복된 경우 예외가 발생합니다. (중복 시 409 Conflict 응답)")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "사용 가능한 아이디인 경우",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "사용 가능한 아이디입니다.")
				}
			)
		),
		@ApiResponse(
			responseCode = "409",
			description = "중복된 아이디인 경우",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						summary = "아이디가 이미 사용중입니다.",
						value = "{\"code\":\"AUTH_006\",\"message\":\"아이디가 이미 사용중입니다.\",\"path\":\"/api/join/check-username\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> checkDuplicateUsername(
		@Parameter(description = "중복 검사를 위한 아이디", required = true)
		@RequestParam String username);

	@Operation(summary = "사번 중복 검사",
		description = "입력한 employeeNumber의 중복 여부를 확인합니다. 중복된 경우 예외가 발생합니다. (중복 시 409 Conflict 응답)")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "사용 가능한 사번인 경우",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "사용 가능한 사번입니다.")
				}
			)
		),
		@ApiResponse(
			responseCode = "409",
			description = "중복된 사번인 경우",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						summary = "사번이 이미 사용 중입니다.",
						value = "{\"code\":\"AUTH_005\",\"message\":\"사번이 이미 사용 중입니다.\",\"path\":\"/api/join/check-employee-number\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> checkDuplicateEmployeeNumber(
		@Parameter(description = "중복 검사를 위한 사번", required = true)
		@RequestParam String employeeNumber);

	@Operation(summary = "로그인", description = "사용자 인증을 수행합니다. 로그인 타입(member, admin)에 따라 적절한 권한 검증이 이루어집니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "로그인 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "로그인 성공")
				}
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "잘못된 파라미터가 전달되었습니다.",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						summary = "잘못된 파라미터",
						value = "{\"code\":\"X002\",\"message\":\"잘못된 파라미터가 전달되었습니다.\",\"path\":\"/api/login\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "401",
			description = "아이디, 비밀번호가 일치하지 않거나, 로그인 타입과 권한이 일치하지 않습니다.",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						summary = "로그인 실패",
						value = "{\"code\":\"AUTH_004\",\"message\":\"아이디, 비밀번호가 일치하지 않습니다.\",\"path\":\"/api/login\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> signIn(@RequestBody LoginRequestDto loginRequestDTO);
}
