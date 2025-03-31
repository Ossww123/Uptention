package com.otoki.uptention.presentation.mining.doc;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import com.otoki.uptention.domain.mining.dto.response.MiningTimeRankResponseDto;
import com.otoki.uptention.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 집중 모드 API 문서화를 위한 인터페이스
 * 실제 구현체는 없으며, Swagger 문서화 목적으로만 사용됩니다.
 */
@Tag(name = "집중 모드 API", description = "집중모드 on/off를 관리하는 컨트롤러")
public interface MiningApiDoc {

	@Operation(summary = "집중 모드 시작", description = "사용자의 집중 모드를 시작한다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "집중모드시작 성공",
			content = @Content(schema = @Schema(implementation = String.class))),
		@ApiResponse(responseCode = "500", description = "서버 내부 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "서버 오류",
						summary = "서버 내부에 문제가 발생",
						value = "{\"code\":\"INTERNAL_SERVER_ERROR\",\"message\":\"서버 내부 오류가 발생했습니다.\",\"path\":\"/api/focus\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> focusModeOn();

	@Operation(summary = "집중 모드 종료", description = "사용자의 집중 모드를 종료한다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "집중모드 종료 성공",
			content = @Content(schema = @Schema(implementation = String.class))),
		@ApiResponse(responseCode = "500", description = "서버 내부 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "서버 오류",
						summary = "서버 내부에 문제가 발생",
						value = "{\"code\":\"INTERNAL_SERVER_ERROR\",\"message\":\"서버 내부 오류가 발생했습니다.\",\"path\":\"/api/focus\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> focusModeOff();

	@Operation(summary = "우수 사원 랭킹 조회", description = "상위 top개의 결과를 기반으로 우수 사원 랭킹을 조회한다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "우수 사원 랭킹 조회 성공",
			content = @Content(mediaType = "application/json", schema = @Schema(implementation = Map.class))),
		@ApiResponse(responseCode = "400", description = "우수 사원 랭킹 조회 실패",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "변수 에러",
						summary = "유효하지 않은 값",
						value = "{\"code\":\"RANK_001\",\"message\":\"top 변수가 올바르지 않습니다.\",\"path\":\"/api/mining-time\"}"
					)
				}
			)
		),
		@ApiResponse(responseCode = "500", description = "서버 내부 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "서버 오류",
						summary = "서버 내부에 문제가 발생",
						value = "{\"code\":\"INTERNAL_SERVER_ERROR\",\"message\":\"서버 내부 오류가 발생했습니다.\",\"path\":\"/api/miningtimes\"}"
					)
				}
			)
		)
	})
	ResponseEntity<Map<String, List<MiningTimeRankResponseDto>>> getMiningTimes(@RequestParam Integer top);
}
