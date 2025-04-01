package com.otoki.uptention.presentation.item.doc;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.item.dto.request.ItemCreateRequestDto;
import com.otoki.uptention.application.item.dto.response.ItemCursorResponseDto;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.domain.item.enums.SortType;
import com.otoki.uptention.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * 상품 API 문서화를 위한 인터페이스
 * 실제 구현체는 없으며, Swagger 문서화 목적으로만 사용됩니다.
 */
@Tag(name = "상품 관리/조회 API", description = "상품 관리, 조회를 담당하는 컨트롤러")
public interface ItemApiDoc {

	@Operation(summary = "상품 상세 정보", description = "목록에서 선택한 상품의 상세 정보 조회")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "상품 상세 정보 조회 성공",
			content = @Content(schema = @Schema(implementation = ItemResponseDto.class))),
		@ApiResponse(responseCode = "404", description = "상품을 찾을 수 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "상품 존재하지 않음",
						summary = "요청한 상품 ID가 존재하지 않음",
						value = "{\"code\":\"ITEM_001\",\"message\":\"상품이 존재하지 않습니다.\",\"path\":\"/api/items/333\"}"
					)
				}
			))
	})
	ResponseEntity<ItemResponseDto> getItemDetails(
		@Parameter(description = "상품 ID", example = "1")
		@PathVariable Integer itemId);

	@Operation(summary = "상품 목록 정보", description = "마켓 플레이스에 등록된 모든 상품 목록 조회")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "상품 목록 조회 성공",
			content = @Content(schema = @Schema(implementation = ItemCursorResponseDto.class))),
		@ApiResponse(responseCode = "404", description = "존재하지 않는 카테고리",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "카테고리 존재하지 않음",
						summary = "요청한 카테고리 ID가 존재하지 않음",
						value = "{\"code\":\"ITEM_003\",\"message\":\"카테고리가 존재하지 않습니다.\",\"path\":\"/api/items\"}"
					)
				}
			)),
		@ApiResponse(responseCode = "400", description = "올바르지 않은 정렬 조건 또는 커서 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "올바르지 않은 정렬 조건",
						summary = "지원하지 않는 정렬 방식",
						value = "{\"code\":\"ITEM_002\",\"message\":\"지원하지 않는 정렬 방식입니다.\",\"path\":\"/api/items\"}"
					),
					@ExampleObject(
						name = "커서 디코딩 실패",
						summary = "잘못된 형식의 커서 값",
						value = "{\"code\":\"CURSOR_002\",\"message\":\"커서 디코딩에 실패했습니다.\",\"path\":\"/api/items\"}"
					),
					@ExampleObject(
						name = "유효하지 않은 커서 형식",
						summary = "지원하지 않는 커서 형식",
						value = "{\"code\":\"CURSOR_003\",\"message\":\"유효하지 않은 커서 형식입니다.\",\"path\":\"/api/items\"}"
					)
				}
			)),
		@ApiResponse(responseCode = "500", description = "커서 또는 서버 오류",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "커서 인코딩 실패",
						summary = "커서를 생성/인코딩하는 과정에서 오류",
						value = "{\"code\":\"CURSOR_001\",\"message\":\"커서 인코딩에 실패했습니다.\",\"path\":\"/api/items\"}"
					)
				}
			)),
	})
	ResponseEntity<ItemCursorResponseDto> getItems(
		@Parameter(description = "카테고리 ID >> 1:리빙가전, 2:주방가전, 3:뷰티, 4:패션의류/잡화, 5:문화여가, 6:생활용품, 7:식품, 8:키즈)")
		@RequestParam(required = false) Integer categoryId,

		@Parameter(description = "검색 키워드")
		@RequestParam(required = false) String keyword,

		@Parameter(description = "페이지네이션 커서")
		@RequestParam(required = false) String cursor,

		@Parameter(description = "페이지 크기")
		@RequestParam(defaultValue = "20") int size,

		@Parameter(description = "정렬 방식")
		@RequestParam(defaultValue = "SALES") SortType sort);

	@Operation(summary = "상품 등록", description = "새로운 상품을 마켓에 등록합니다")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "상품 등록 성공",
			content = @Content(
				mediaType = "application/json",
				schema = @Schema(type = "string", example = "상품 등록 완료")
			)),
		@ApiResponse(responseCode = "400", description = "올바르지 않은 요청 데이터",
			content = @Content(
				mediaType = "application/json",
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "유효성 검증 실패",
						summary = "입력 데이터 유효성 검증 실패",
						value = "{\"code\":\"INVALID_PARAMETER\",\"message\":\"잘못된 파라미터가 전달되었습니다.\",\"path\":\"/api/items\"}"
					),
					@ExampleObject(
						name = "이미지 개수 제한",
						summary = "허용되지 않은 이미지 개수",
						value = "{\"code\":\"ITEM_010\",\"message\":\"이미지는 1개 이상 3개 이하로 업로드해야 합니다.\",\"path\":\"/api/items\"}"
					),
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
			)),
		@ApiResponse(responseCode = "404", description = "존재하지 않는 카테고리",
			content = @Content(
				mediaType = "application/json",
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "카테고리 존재하지 않음",
						summary = "요청한 카테고리 ID가 존재하지 않음",
						value = "{\"code\":\"ITEM_003\",\"message\":\"카테고리가 존재하지 않습니다.\",\"path\":\"/api/items\"}"
					)
				}
			)),
		@ApiResponse(responseCode = "500", description = "서버 오류",
			content = @Content(
				mediaType = "application/json",
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "파일 업로드 오류",
						summary = "파일 업로드 처리 중 서버 오류",
						value = "{\"code\":\"FILE_009\",\"message\":\"파일 업로드 중 오류가 발생했습니다.\",\"path\":\"/api/items\"}"
					),
					@ExampleObject(
						name = "서버 내부 오류",
						summary = "서버 내부 처리 오류",
						value = "{\"code\":\"INTERNAL_SERVER_ERROR\",\"message\":\"서버 에러가 발생했습니다.\",\"path\":\"/api/items\"}"
					)
				}
			))
	})
	ResponseEntity<String> registerItem(
		@Parameter(
			description = "상품 정보",
			required = true,
			content = @Content(schema = @Schema(implementation = ItemCreateRequestDto.class))
		)
		@Valid @RequestPart("item") ItemCreateRequestDto itemCreateRequestDto,

		@Parameter(
			description = "상품 이미지 파일들 (1개 이상 3개 이하)",
			required = true,
			content = @Content(mediaType = "multipart/form-data")
		)
		@RequestPart("images") List<MultipartFile> images);
}