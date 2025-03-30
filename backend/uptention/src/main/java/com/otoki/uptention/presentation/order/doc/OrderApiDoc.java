package com.otoki.uptention.presentation.order.doc;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.otoki.uptention.application.order.dto.request.DeliveryInfoRequestDto;
import com.otoki.uptention.application.order.dto.request.GiftRequestDto;
import com.otoki.uptention.application.order.dto.request.ItemVerificationDto;
import com.otoki.uptention.application.order.dto.request.OrderRequestDto;
import com.otoki.uptention.application.order.dto.response.InitiateOrderResponseDto;
import com.otoki.uptention.application.order.dto.response.ItemVerificationResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderDetailResponseDto;
import com.otoki.uptention.application.order.dto.response.OrderHistoryCursorResponseDto;
import com.otoki.uptention.domain.order.enums.OrderHistoryType;
import com.otoki.uptention.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * 상품 검증 및 주문 관리 API 문서화를 위한 인터페이스
 * 실제 구현체는 없으며, Swagger 문서화 목적으로만 사용됩니다.
 */
@Tag(name = "상품 주문/조회 API", description = "상품 구매, 선물을 담당하는 컨트롤러")
public interface OrderApiDoc {

	@Operation(summary = "상품 주문", description = "주문 정보를 받아 주문을 생성합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "주문 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "주문 처리 성공")
				}
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "재고 부족 또는 잘못된 요청",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "재고 부족",
						summary = "요청한 상품의 재고가 부족함",
						value = "{\"code\":\"ITEM_004\",\"message\":\"재고가 부족한 상품이 있습니다.\",\"path\":\"/api/orders/purchase\"}"
					),
					@ExampleObject(
						name = "유효성 검증 실패",
						summary = "잘못된 형식의 요청",
						value = "{\"code\":\"X002\",\"message\":\"[address] 배송 주소는 필수입니다.; [items] 주문 상품 목록은 필수입니다.\",\"path\":\"/api/orders/purchase\"}"
					)

				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "상품 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "상품 존재하지 않음",
						summary = "요청한 상품이 존재하지 않음",
						value = "{\"code\":\"ITEM_001\",\"message\":\"상품이 존재하지 않습니다.\",\"path\":\"/api/orders/purchase\"}"
					)
				}
			)
		)
	})
	ResponseEntity<InitiateOrderResponseDto> purchaseOrder(
		@Parameter(description = "주문 정보", required = true)
		@Valid @RequestBody OrderRequestDto orderRequestDto);

	@Operation(summary = "상품 선물", description = "선물 정보를 받아 선물 주문을 생성합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "선물 주문 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "선물 처리 성공")
				}
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "재고 부족 또는 잘못된 요청",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "재고 부족",
						summary = "선물할 상품의 재고가 부족함",
						value = "{\"code\":\"ITEM_004\",\"message\":\"재고가 부족한 상품이 있습니다.\",\"path\":\"/api/orders/gift\"}"
					),
					@ExampleObject(
						name = "유효성 검증 실패",
						summary = "선물 받는 사용자 ID 누락",
						value = "{\"code\":\"X002\",\"message\":\"[receiverId] 선물 받는 사용자 id는 필수입니다.\",\"path\":\"/api/orders/gift\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "사용자 또는 상품 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "사용자 없음",
						summary = "선물 받는 사용자가 존재하지 않음",
						value = "{\"code\":\"USER_001\",\"message\":\"사용자를 찾을 수 없습니다.\",\"path\":\"/api/orders/gift\"}"
					),
					@ExampleObject(
						name = "상품 존재하지 않음",
						summary = "요청한 상품이 존재하지 않음",
						value = "{\"code\":\"ITEM_001\",\"message\":\"상품이 존재하지 않습니다.\",\"path\":\"/api/orders/gift\"}"
					)
				}
			)
		)
	})
	ResponseEntity<InitiateOrderResponseDto> giftOrder(
		@Parameter(description = "선물 정보", required = true)
		@Valid @RequestBody GiftRequestDto giftRequestDto);

	@Operation(summary = "상품 검증", description = "주문 전 상품의 재고, 가격, 상태 등을 검증합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "상품 검증 성공",
			content = @Content(
				array = @ArraySchema(schema = @Schema(implementation = ItemVerificationResponseDto.class))
			)
		),
		@ApiResponse(
			responseCode = "400",
			description = "재고 부족 또는 가격 불일치",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "재고 부족",
						summary = "요청한 상품의 재고가 부족함",
						value = "{\"code\":\"ITEM_004\",\"message\":\"재고가 부족한 상품이 있습니다.\",\"path\":\"/api/orders/verify\"}"
					),
					@ExampleObject(
						name = "유효성 검증 실패",
						summary = "잘못된 형식의 요청",
						value = "{\"code\":\"X002\",\"message\":\"[items] 검증할 상품 목록은 필수입니다.\",\"path\":\"/api/orders/verify\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "상품 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "상품 존재하지 않음",
						summary = "요청한 상품이 존재하지 않음",
						value = "{\"code\":\"ITEM_001\",\"message\":\"상품이 존재하지 않습니다.\",\"path\":\"/api/orders/verify\"}"
					),
					@ExampleObject(
						name = "상품 비활성화",
						summary = "요청한 상품이 삭제되었거나 비활성화됨",
						value = "{\"code\":\"ITEM_007\",\"message\":\"삭제된 상품 입니다.\",\"path\":\"/api/orders/verify\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "409",
			description = "상품 가격 불일치",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "가격 불일치",
						summary = "요청한 상품의 가격이 현재 가격과 다름",
						value = "{\"code\":\"ITEM_006\",\"message\":\"상품 가격이 변경되었습니다.\",\"path\":\"/api/orders/verify\"}"
					)
				}
			)
		)
	})
	ResponseEntity<List<ItemVerificationResponseDto>> verifyOrderItem(
		@Parameter(description = "상품 검증 정보", required = true)
		@Valid @RequestBody List<ItemVerificationDto> itemVerificationDtos);

	@Operation(summary = "배송 정보 등록", description = "주문에 배송 정보를 등록합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "배송 정보 등록 성공",
			content = @Content(
				schema = @Schema(implementation = String.class),
				examples = {
					@ExampleObject(value = "배송지 정보 등록 성공")
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
						summary = "필수 배송 정보 누락",
						value = "{\"code\":\"X002\",\"message\":\"[address] 배송 주소는 필수입니다.\",\"path\":\"/api/orders/123/delivery-info\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "주문 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "주문 존재하지 않음",
						summary = "요청한 주문이 존재하지 않음",
						value = "{\"code\":\"ORDER_001\",\"message\":\"주문이 존재하지 않습니다.\",\"path\":\"/api/orders/999/delivery-info\"}"
					)
				}
			)
		)
	})
	ResponseEntity<String> registerDeliveryInfo(
		@Parameter(description = "주문 ID", required = true, example = "1")
		@PathVariable Integer orderId,
		@Parameter(description = "배송 정보", required = true)
		@Valid @RequestBody DeliveryInfoRequestDto deliveryInfoRequestDto);

	@Operation(summary = "주문 내역 조회", description = "사용자의 주문 내역을 커서 기반 페이지네이션으로 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "조회 성공",
			content = @Content(schema = @Schema(implementation = OrderHistoryCursorResponseDto.class))
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
						value = "{\"code\":\"CURSOR_003\",\"message\":\"유효하지 않은 커서 형식입니다.\",\"path\":\"/api/orders\"}"
					),
					@ExampleObject(
						name = "유효하지 않은 주문 유형",
						summary = "지원하지 않는 주문 유형",
						value = "{\"code\":\"ORDER_002\",\"message\":\"지원하지 않는 주문 유형입니다.\",\"path\":\"/api/orders\"}"
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
						value = "{\"code\":\"CURSOR_001\",\"message\":\"커서 인코딩에 실패했습니다.\",\"path\":\"/api/orders\"}"
					)
				}
			)),
	})
	ResponseEntity<OrderHistoryCursorResponseDto> getOrderHistory(
		@Parameter(description = "페이지네이션 커서 값")
		@RequestParam(required = false) String cursor,

		@Parameter(description = "페이지 크기", example = "10")
		@RequestParam(defaultValue = "10") int size,

		@Parameter(description = "주문 유형 (PURCHASE: 일반구매, GIFT: 선물구매)")
		@RequestParam(defaultValue = "PURCHASE") OrderHistoryType type);

	@Operation(summary = "주문 상세 조회", description = "주문 ID와 주문 상품 ID를 기반으로 주문 상세 정보를 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(
			responseCode = "200",
			description = "조회 성공",
			content = @Content(
				schema = @Schema(implementation = OrderDetailResponseDto.class),
				examples = {
					@ExampleObject(
						name = "구매 주문 예시",
						summary = "일반 구매 주문 응답",
						value = "{\"orderItemId\":1,\"orderId\":1,\"itemName\":\"[가전디지털] 테스트 상품 1\",\"brand\":\"테스트 브랜드 2\",\"totalPrice\":149000,\"status\":\"결제 완료\",\"orderDate\":\"2024-03-18T09:30:00\",\"quantity\":1,\"address\":\"서울특별시 강남구 테헤란로 123\"}"
					),
					@ExampleObject(
						name = "선물 주문 예시",
						summary = "선물 주문 응답",
						value = "{\"orderItemId\":3,\"orderId\":3,\"itemName\":\"[패션의류/잡화] 테스트 상품 4\",\"brand\":\"테스트 브랜드 5\",\"totalPrice\":42000,\"status\":\"결제 완료\",\"orderDate\":\"2024-03-21T15:30:00\",\"receiverName\":\"김민수\"}"
					)
				}
			)
		),
		@ApiResponse(
			responseCode = "404",
			description = "주문 또는 주문 상품을 찾을 수 없음",
			content = @Content(
				schema = @Schema(implementation = ErrorResponse.class),
				examples = {
					@ExampleObject(
						name = "ORDER_ITEM_NOT_FOUND",
						summary = "요청한 주문 상품이 존재하지 않음",
						value = "{\"code\":\"ORDER_ITEM_001\",\"message\":\"주문 상품이 존재하지 않습니다.\",\"path\":\"/api/orders/{orderId}/{orderItemId}\"}"
					)
				}
			)
		)
	})
	ResponseEntity<OrderDetailResponseDto> getOrderDetail(
		@Parameter(description = "주문 ID", required = true, example = "1")
		@PathVariable Integer orderId,

		@Parameter(description = "주문 상품 ID", required = true, example = "1")
		@PathVariable Integer orderItemId
	);

}