package com.otoki.uptention.order;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.otoki.uptention.AppServiceTestSupport;
import com.otoki.uptention.application.order.dto.request.ItemVerificationDto;
import com.otoki.uptention.application.order.dto.response.ItemVerificationResponseDto;
import com.otoki.uptention.application.order.service.OrderVerifyAppService;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

public class OrderVerifyAppServiceTest extends AppServiceTestSupport {

	@Autowired
	private OrderVerifyAppService orderVerifyAppService;

	@MockBean
	private ItemService itemService;

	@Test
	@DisplayName("상품 검증을 성공적으로 수행하고 검증된 상품 정보를 반환한다")
	void verifyOrderItem_Success() {
		// given
		// 요청 DTO 생성
		List<ItemVerificationDto> itemVerificationDtos = Arrays.asList(
			createItemVerificationDto(1, 10000, 2),
			createItemVerificationDto(2, 20000, 1)
		);

		// 서비스에서 반환할 상품 정보 준비
		List<ItemDto> itemDtos = Arrays.asList(
			createItemDto(1, "테스트 상품 1", 10000, 10, true),
			createItemDto(2, "테스트 상품 2", 20000, 20, true)
		);

		when(itemService.getItemsByIds(Arrays.asList(1, 2))).thenReturn(itemDtos);

		// when
		List<ItemVerificationResponseDto> response = orderVerifyAppService.verifyOrderItem(itemVerificationDtos);

		// then
		assertThat(response).isNotNull();
		assertThat(response).hasSize(2);
		assertThat(response.get(0).getItemId()).isEqualTo(1);
		assertThat(response.get(1).getItemId()).isEqualTo(2);

		// 서비스 호출 검증
		verify(itemService, times(1)).getItemsByIds(Arrays.asList(1, 2));
	}

	@Test
	@DisplayName("존재하지 않는 상품이 있을 경우 예외가 발생한다")
	void verifyOrderItem_ThrowsException_WhenItemNotFound() {
		// given
		List<ItemVerificationDto> itemVerificationDtos = Arrays.asList(
			createItemVerificationDto(1, 10000, 2),
			createItemVerificationDto(2, 20000, 1)
		);

		// 하나의 상품만 반환되도록 설정 (item2는 존재하지 않음)
		List<ItemDto> itemDtos = Collections.singletonList(
			createItemDto(1, "테스트 상품 1", 10000, 10, true)
		);

		when(itemService.getItemsByIds(Arrays.asList(1, 2))).thenReturn(itemDtos);

		// when & then
		assertThatThrownBy(() -> orderVerifyAppService.verifyOrderItem(itemVerificationDtos))
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_NOT_FOUND);
			});

		verify(itemService, times(1)).getItemsByIds(Arrays.asList(1, 2));
	}

	@Test
	@DisplayName("상품이 비활성화 상태일 경우 예외가 발생한다")
	void verifyOrderItem_ThrowsException_WhenItemUnavailable() {
		// given
		List<ItemVerificationDto> itemVerificationDtos = Collections.singletonList(
			createItemVerificationDto(1, 10000, 2)
		);

		// 비활성화된 상품 반환
		List<ItemDto> itemDtos = Collections.singletonList(
			createItemDto(1, "비활성 상품", 10000, 10, false)
		);

		when(itemService.getItemsByIds(Collections.singletonList(1))).thenReturn(itemDtos);

		// when & then
		assertThatThrownBy(() -> orderVerifyAppService.verifyOrderItem(itemVerificationDtos))
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_UNAVAILABLE);
			});
	}

	@Test
	@DisplayName("요청 가격과 현재 상품 가격이 다를 경우 예외가 발생한다")
	void verifyOrderItem_ThrowsException_WhenPriceMismatch() {
		// given
		List<ItemVerificationDto> itemVerificationDtos = Collections.singletonList(
			createItemVerificationDto(1, 8000, 2) // 실제 가격(10000)과 다른 가격
		);

		// 실제 가격이 10000인 상품 반환
		List<ItemDto> itemDtos = Collections.singletonList(
			createItemDto(1, "테스트 상품", 10000, 10, true)
		);

		when(itemService.getItemsByIds(Collections.singletonList(1))).thenReturn(itemDtos);

		// when & then
		assertThatThrownBy(() -> orderVerifyAppService.verifyOrderItem(itemVerificationDtos))
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_PRICE_MISMATCH);
			});
	}

	@Test
	@DisplayName("재고가 부족할 경우 예외가 발생한다")
	void verifyOrderItem_ThrowsException_WhenInsufficientStock() {
		// given
		List<ItemVerificationDto> itemVerificationDtos = Collections.singletonList(
			createItemVerificationDto(1, 10000, 15) // 현재 재고(10)보다 많은 수량
		);

		// 재고가 10개인 상품 반환
		List<ItemDto> itemDtos = Collections.singletonList(
			createItemDto(1, "테스트 상품", 10000, 10, true)
		);

		when(itemService.getItemsByIds(Collections.singletonList(1))).thenReturn(itemDtos);

		// when & then
		assertThatThrownBy(() -> orderVerifyAppService.verifyOrderItem(itemVerificationDtos))
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_INSUFFICIENT_STOCK);
			});
	}

	/**
	 * ItemDto 객체 생성 헬퍼 메서드
	 */
	private ItemDto createItemDto(Integer id, String name, int price, int quantity, boolean status) {
		return ItemDto.builder()
			.itemId(id)
			.name(name)
			.price(price)
			.brand("브랜드")
			.quantity(quantity)
			.salesCount(10)
			.status(status)
			.thumbnail("http://example.com/image1.jpg")
			.build();
	}

	/**
	 * ItemVerificationDto 객체 생성 헬퍼 메서드
	 */
	private ItemVerificationDto createItemVerificationDto(Integer itemId, Integer price, Integer quantity) {
		return new ItemVerificationDto(itemId, price, quantity);
	}
}