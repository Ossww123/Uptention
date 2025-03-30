package com.otoki.uptention.presentation.user.docs;

import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.user.dto.response.PointResponseDto;
import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "유저 API", description = "유저 API")
public interface UserApiDoc {
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
}