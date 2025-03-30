package com.otoki.uptention.presentation.user.docs;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.mining.service.dto.response.MiningTimeResponseDto;
import com.otoki.uptention.application.user.dto.response.PointResponseDto;
import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;
import com.otoki.uptention.application.user.dto.response.UserCursorResponseDto;
import com.otoki.uptention.application.user.dto.response.UserResponseDto;
import com.otoki.uptention.domain.mining.entity.MiningTime;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "유저 API", description = "유저 API")
public interface UserApiDoc {
	@Operation(summary = "유저 정보 조회", description = "특정 사용자의 상세 정보를 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "사용자 정보 조회 성공",
			content = @Content(
				schema = @Schema(implementation = UserResponseDto.class),
				examples = {
					@ExampleObject(
						value = "{\"userId\":1,\"username\":\"user001\",\"name\":\"User001\",\"employeeNumber\":\"EMP001\",\"wallet\":\"wallet001\",\"profileImage\":\"http://example.com/path/to/profile.jpg\",\"role\":\"ROLE_MEMBER\",\"createdAt\":\"2025-03-30T12:00:00\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "사용자를 찾을 수 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						value = "{\"code\":\"USER_001\",\"message\":\"사용자를 찾을 수 없습니다.\",\"path\":\"/api/users/{userId}\"}"
					)
				}
			)
		)
	})
	ResponseEntity<UserResponseDto> getUser(@PathVariable Integer userId);

	@Operation(
		summary = "유저 정보 페이징 조회",
		description = "커서 기반으로 유저 정보를 페이징 조회합니다. "
			+ "검색 조건으로 유저 ROLE, 키워드, 커서, 페이지 크기(size), 정렬 타입(sort)을 전달받으며, "
			+ "로그인한 사용자의 소속 Company 내에서 조회됩니다."
	)
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "유저 정보 페이징 조회 성공",
			content = @Content(
				schema = @Schema(implementation = UserCursorResponseDto.class),
				examples = {
					@ExampleObject(
						value = "{\"users\":[{\"userId\":1,\"username\":\"user001\",\"name\":\"User001\",\"employeeNumber\":\"EMP001\",\"wallet\":\"wallet001\",\"profileImage\":\"http://example.com/path/to/profile.jpg\",\"role\":\"ROLE_MEMBER\",\"createdAt\":\"2025-03-30T12:00:00\"}],\"hasNextPage\":true,\"nextCursor\":\"eyJ2YWx1ZSI6IjIwIiwiaWQiOjF9\"}"
					)
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
						name = "USER_INVALID_SORT_TYPE",
						value = "{\"code\":\"USER_002\",\"message\":\"지원하지 않는 정렬 방식입니다.\",\"path\":\"/api/users\"}"
					),
					@ExampleObject(
						name = "CURSOR_DECODING_FAILED",
						value = "{\"code\":\"CURSOR_002\",\"message\":\"커서 디코딩에 실패했습니다.\",\"path\":\"/api/users\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "500",
			description = "서버 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "CURSOR_ENCODING_FAILED",
						value = "{\"code\":\"CURSOR_001\",\"message\":\"커서 인코딩에 실패했습니다.\",\"path\":\"/api/users\"}"
					)
				}
			)
		)
	})
	ResponseEntity<UserCursorResponseDto> getUsers(
		@Parameter(
			description = "조회할 유저의 ROLE. 미입력 시 ROLE_MEMBER와 ROLE_TEMP_MEMBER를 모두 조회합니다.",
			schema = @Schema(implementation = UserRole.class)
		)
		@RequestParam(required = false) UserRole userRole,

		@Parameter(
			description = "유저 검색 키워드 (이름)",
			example = "John"
		)
		@RequestParam(required = false) String keyword,

		@Parameter(
			description = "커서 문자열 (Base64 인코딩된 JSON)",
			example = "eyJ2YWx1ZSI6IjIwIiwiaWQiOjF9"
		)
		@RequestParam(required = false) String cursor,

		@Parameter(
			description = "한 페이지 당 조회할 유저 수",
			example = "20"
		)
		@RequestParam(defaultValue = "20") int size,

		@Parameter(
			description = "유저 정렬 타입 (NAMES_ASC, REGISTER_DATE_ASC, REGISTER_DATE_DESC)",
			schema = @Schema(implementation = UserSortType.class),
			example = "NAMES_ASC"
		)
		@RequestParam(defaultValue = "NAMES_ASC") UserSortType sort
	);

	@Operation(summary = "유저 삭제", description = "사용자를 삭제합니다. 로그인한 사용자가 삭제 대상이거나, 관리자 권한을 가진 경우에만 삭제가 가능합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "회원 삭제 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "\"회원 삭제 성공\"")
				}
			)
		),
		@ApiResponse(
			responseCode = "403",
			description = "권한 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						value = "{\"code\":\"AUTH_003\",\"message\":\"해당 요청의 권한이 없습니다.\",\"path\":\"/api/users/{userId}\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "사용자를 찾을 수 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						value = "{\"code\":\"USER_001\",\"message\":\"사용자를 찾을 수 없습니다.\",\"path\":\"/api/users/{userId}\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> deleteUser(@PathVariable Integer userId);

	@Operation(summary = "프로필 이미지 업로드", description = "사용자의 프로필 이미지를 업로드 합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "프로필 이미지 업로드 성공",
			content = @Content(
				schema = @Schema(implementation = ProfileImageResponseDto.class),
				examples = {
					@ExampleObject(
						value = "{\"profileImage\":\"https://example.com/path/to/uploaded/image.jpg\"}"
					)
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
						name = "파일이 비어있습니다.",
						value = "{\"code\":\"FILE_001\",\"message\":\"파일이 비어있습니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					),
					@ExampleObject(
						name = "파일 크기가 너무 큽니다.",
						value = "{\"code\":\"FILE_002\",\"message\":\"파일 크기가 너무 큽니다. 최대 허용 크기는 5MB 바이트 입니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					),
					@ExampleObject(
						name = "유효하지 않은 파일 이름입니다.",
						value = "{\"code\":\"FILE_003\",\"message\":\"유효하지 않은 파일 이름입니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					),
					@ExampleObject(
						name = "허용되지 않은 파일 확장자입니다.",
						value = "{\"code\":\"FILE_004\",\"message\":\"허용되지 않은 파일 확장자입니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					),
					@ExampleObject(
						name = "허용되지 않은 MIME 타입입니다.",
						value = "{\"code\":\"FILE_005\",\"message\":\"허용되지 않은 MIME 타입입니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					),
					@ExampleObject(
						name = "파일 헤더 정보를 읽어오지 못했습니다.",
						value = "{\"code\":\"FILE_006\",\"message\":\"파일 헤더 정보를 읽어오지 못했습니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					),
					@ExampleObject(
						name = "파일의 매직 넘버 불일치",
						value = "{\"code\":\"FILE_007\",\"message\":\"파일의 매직 넘버가 확장자와 일치하지 않습니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "500",
			description = "서버 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "파일 검증 중 오류",
						value = "{\"code\":\"FILE_008\",\"message\":\"파일 검증 중 오류가 발생했습니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					),
					@ExampleObject(
						name = "파일 업로드 중 오류",
						value = "{\"code\":\"FILE_009\",\"message\":\"파일 업로드 중 오류가 발생했습니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "403",
			description = "권한 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						value = "{\"code\":\"AUTH_003\",\"message\":\"해당 요청의 권한이 없습니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					)
				}
			)
		)
	})
	ResponseEntity<ProfileImageResponseDto> updateProfileImage(
		@PathVariable Integer userId,
		@RequestParam("profileImage") MultipartFile profileImage);

	@Operation(summary = "프로필 이미지 삭제", description = "사용자의 프로필 이미지를 기본 이미지로 변경합니다. 기존 이미지가 기본 이미지가 아닌 경우 파일을 삭제한 후 기본 이미지로 변경됩니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "프로필 이미지 삭제(기본 이미지로 변경) 성공",
			content = @Content(
				schema = @Schema(implementation = ProfileImageResponseDto.class),
				examples = {
					@ExampleObject(value = "{\"profileImage\":\"https://example.com/path/to/profile-default.jpg\"}")
				}
			)
		),
		@ApiResponse(
			responseCode = "403",
			description = "권한 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						value = "{\"code\":\"AUTH_003\",\"message\":\"해당 요청의 권한이 없습니다.\",\"path\":\"/api/users/{userId}/profiles\"}"
					)
				}
			)
		)
	})
	ResponseEntity<ProfileImageResponseDto> deleteProfileImage(@PathVariable Integer userId);

	@Operation(summary = "포인트 조회", description = "사용자의 프로필 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "포인트 조회 성공",
			content = @Content(
				schema = @Schema(implementation = PointResponseDto.class),
				examples = {
					@ExampleObject(value = "{\"point\":\"100\"}")
				}
			)
		),
		@ApiResponse(
			responseCode = "403",
			description = "권한 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						value = "{\"code\":\"AUTH_003\",\"message\":\"해당 요청의 권한이 없습니다.\",\"path\":\"/api/users/{userId}/point\"}"
					)
				}
			)
		)
	})
	ResponseEntity<PointResponseDto> getUserPoint(@PathVariable Integer userId);

	@Operation(summary = "스크린타임 조회", description = "사용자의 특정 기간 내 포커스 모드 시간을 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "스크린타임 조회 성공",
			content = @Content(
				schema = @Schema(implementation = MiningTime.class),
				examples = {
					@ExampleObject(
						value = "[{\"startTime\":\"2024-01-01T08:00:00\",\"endTime\":\"2024-01-01T12:00:00\", \"totalTime\":\"10\"}]"
					)
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
						name = "유효하지 않은 날짜 범위",
						value = "{\"code\":\"DASHBOARD_001\",\"message\":\"종료 시간이 시작 시간보다 이전입니다.\",\"path\":\"/api/users/{userId}/mining-times?startTime=&endTime=\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "403",
			description = "권한 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						value = "{\"code\":\"AUTH_003\",\"message\":\"해당 요청의 권한이 없습니다.\",\"path\":\"/api/users/{userId}/mining-times?startTime=&endTime=\"}"
					)
				}
			)
		)
	})
	ResponseEntity<List<MiningTimeResponseDto>> getMiningTimes(
		@PathVariable Integer userId,
		@RequestParam LocalDateTime startTime,
		@RequestParam LocalDateTime endTime);
}