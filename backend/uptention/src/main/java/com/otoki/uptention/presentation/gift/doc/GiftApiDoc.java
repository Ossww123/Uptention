package com.otoki.uptention.presentation.gift.doc;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import com.otoki.uptention.application.gift.dto.response.GiftHistoryCursorResponseDto;
import com.otoki.uptention.domain.order.enums.GiftStatus;
import com.otoki.uptention.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 선물함 API 문서화를 위한 인터페이스
 * 실제 구현체는 없으며, Swagger 문서화 목적으로만 사용됩니다.
 */
@Tag(name = "선물함 API", description = "선물함 관련 기능을 제공하는 API")
public interface GiftApiDoc {

	@Operation(summary = "선물함 목록 조회", description = "사용자가 받은 선물 목록을 커서 기반 페이지네이션으로 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "조회 성공",
			content = @Content(schema = @Schema(implementation = GiftHistoryCursorResponseDto.class))
		),
		@ApiResponse(
			responseCode = "400",
			description = "잘못된 요청",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "유효하지 않은 커서",
						summary = "잘못된 형식의 커서 값",
						value = "{\"code\":\"CURSOR_003\",\"message\":\"유효하지 않은 커서 형식입니다.\",\"path\":\"/api/gifts\"}"
					),
					@ExampleObject(
						name = "커서 디코딩 실패",
						summary = "커서 디코딩 과정에서 오류 발생",
						value = "{\"code\":\"CURSOR_002\",\"message\":\"커서 디코딩에 실패했습니다.\",\"path\":\"/api/gifts\"}"
					)
				}
			)
		),
		@ApiResponse(responseCode = "500", description = "커서 또는 서버 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "커서 인코딩 실패",
						summary = "커서를 생성/인코딩하는 과정에서 오류",
						value = "{\"code\":\"CURSOR_001\",\"message\":\"커서 인코딩에 실패했습니다.\",\"path\":\"/api/gifts\"}"
					)
				}
			)),
	})
	ResponseEntity<GiftHistoryCursorResponseDto> getGiftHistory(
		@Parameter(description = "페이지네이션 커서 값")
		@RequestParam(required = false) String cursor,

		@Parameter(description = "페이지 크기", example = "10")
		@RequestParam(defaultValue = "10") int size,

		@Parameter(description = "선물 상태 (PENDING: 수령 대기, RECEIVED: 수령 완료)", example = "PENDING")
		@RequestParam(defaultValue = "PENDING") GiftStatus type);
}