package com.otoki.uptention.application.order.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.order.dto.request.ItemVerificationDto;
import com.otoki.uptention.application.order.dto.request.OrderVerificationRequestDto;
import com.otoki.uptention.application.order.dto.response.OrderVerificationResponseDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderVerifyAppServiceImpl implements OrderVerifyAppService {

	private final ItemService itemService;

	/**
	 * 주문 전 상품 검증
	 * 가격, 재고, 상품 상태 등을 검증
	 * 문제가 있을 경우 바로 예외를 발생시킴
	 */
	@Override
	public OrderVerificationResponseDto verifyOrderItem(OrderVerificationRequestDto requestDto) {
		// 요청된 상품 ID 목록 추출
		List<Integer> itemIds = requestDto.getItems().stream()
			.map(ItemVerificationDto::getItemId)
			.collect(Collectors.toList());

		// 상품 정보와 첫 번째 이미지를 한 번에 조회
		List<ItemDto> itemDtos = itemService.getItemsByIds(itemIds);

		// 모든 요청 상품이 DB에 존재하는지 확인
		if (requestDto.getItems().size() != itemDtos.size()) {
			throw new CustomException(ErrorCode.ITEM_NOT_FOUND);
		}

		// ID로 빠르게 접근할 수 있도록 Map 생성
		Map<Integer, ItemDto> itemDtoMap = itemDtos.stream()
			.collect(Collectors.toMap(ItemDto::getItemId, dto -> dto));

		// 각 상품별 검증 수행
		for (ItemVerificationDto requestItem : requestDto.getItems()) {
			ItemDto itemDto = itemDtoMap.get(requestItem.getItemId());
			validateItem(requestItem, itemDto);
		}

		// 검증 통과 후 응답 생성 (이미 조회한 DTO 사용)
		return OrderVerificationResponseDto.builder()
			.items(itemDtos)
			.build();
	}

	/**
	 * 상품 DTO를 사용한 검증
	 * 상태, 가격, 재고를 검증
	 */
	private void validateItem(ItemVerificationDto requestItem, ItemDto itemDto) {
		// 상품이 존재하지 않는 경우 (맵에서 찾지 못한 경우)
		if (itemDto == null) {
			throw new CustomException(ErrorCode.ITEM_NOT_FOUND);
		}

		// 상품이 삭제되었거나 비활성 상태인 경우
		if (!itemDto.getStatus()) {
			throw new CustomException(ErrorCode.ITEM_UNAVAILABLE);
		}

		// 가격이 일치하지 않는 경우
		if (!itemDto.getPrice().equals(requestItem.getPrice())) {
			throw new CustomException(ErrorCode.ITEM_PRICE_MISMATCH);
		}

		// 재고가 부족한 경우
		if (itemDto.getQuantity() < requestItem.getQuantity()) {
			throw new CustomException(ErrorCode.ITEM_INSUFFICIENT_STOCK);
		}
	}
}