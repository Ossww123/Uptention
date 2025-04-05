package com.otoki.uptention.application.order.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.order.dto.request.ItemVerificationDto;
import com.otoki.uptention.application.order.dto.response.ItemVerificationResponseDto;
import com.otoki.uptention.domain.inventory.dto.InventoryDto;
import com.otoki.uptention.domain.inventory.service.InventoryService;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class OrderVerifyAppServiceImpl implements OrderVerifyAppService {

	private final ItemService itemService;
	private final InventoryService inventoryService;

	/**
	 * 주문 전 상품 검증
	 * 가격, 재고, 상품 상태 등을 검증
	 * 문제가 있을 경우 바로 예외를 발생시킴
	 */
	@Override
	public List<ItemVerificationResponseDto> verifyOrderItem(List<ItemVerificationDto> itemVerificationDtos) {
		// 요청된 상품 ID 목록 추출
		List<Integer> itemIds = itemVerificationDtos.stream()
			.map(ItemVerificationDto::getItemId)
			.collect(Collectors.toList());

		// 상품 정보와 첫 번째 이미지를 한 번에 조회
		List<ItemDto> itemDtos = itemService.getItemsByIds(itemIds);

		// 모든 요청 상품이 DB에 존재하는지 확인
		if (itemVerificationDtos.size() != itemDtos.size()) {
			throw new CustomException(ErrorCode.ITEM_NOT_FOUND);
		}

		// ID로 빠르게 접근할 수 있도록 Map 생성
		Map<Integer, ItemDto> itemDtoMap = itemDtos.stream()
			.collect(Collectors.toMap(ItemDto::getItemId, dto -> dto));

		// 2. Redis에서 실시간 재고 정보 조회
		Map<Integer, InventoryDto> inventoryMap;
		try {
			inventoryMap = inventoryService.getInventories(itemIds);
			log.debug("Retrieved {} inventory records from Redis", inventoryMap.size());
		} catch (Exception e) {
			log.warn("Failed to retrieve inventory data from Redis, falling back to database inventory: {}",
				e.getMessage());
			inventoryMap = null;
		}

		// 3. 각 상품별 검증 수행 - 하나라도 실패하면 예외 발생하고 종료됨
		for (ItemVerificationDto requestItem : itemVerificationDtos) {
			Integer itemId = requestItem.getItemId();
			ItemDto itemDto = itemDtoMap.get(itemId);

			// Redis 재고 정보가 있으면 실시간 재고 사용, 없으면 DB 재고 사용
			Integer availableQuantity = null;
			if (inventoryMap != null && inventoryMap.containsKey(itemId)) {
				availableQuantity = inventoryMap.get(itemId).getAvailableQuantity();
				log.debug("Using Redis inventory for item {}: available={}", itemId, availableQuantity);
			} else {
				availableQuantity = itemDto.getQuantity();
				log.debug("Using DB inventory for item {}: available={}", itemId, availableQuantity);
			}

			// 실시간 재고 정보를 반영한 검증 수행
			validateItem(requestItem, itemDto, availableQuantity);
		}

		// 4. 모든 검증 통과 후 응답 DTO 생성
		List<ItemVerificationResponseDto> verifiedItems = itemVerificationDtos.stream()
			.map(requestItem -> {
				Integer itemId = requestItem.getItemId();
				ItemDto itemDto = itemDtoMap.get(itemId);

				return ItemVerificationResponseDto.builder()
					.itemId(itemDto.getItemId())
					.name(itemDto.getName())
					.price(itemDto.getPrice())
					.brand(itemDto.getBrand())
					.quantity(requestItem.getQuantity())
					.totalPrice(itemDto.getPrice() * requestItem.getQuantity())
					.thumbnail(itemDto.getThumbnail())
					.build();
			})
			.collect(Collectors.toList());

		return verifiedItems;
	}

	/**
	 * 상품 검증 - 실시간 재고 정보 활용
	 * 상태, 가격, 재고를 검증
	 *
	 * @param requestItem 검증 요청 DTO
	 * @param itemDto 상품 기본 정보
	 * @param availableQuantity 실시간 가용 재고 수량
	 */
	private void validateItem(ItemVerificationDto requestItem, ItemDto itemDto, Integer availableQuantity) {
		// 상품이 존재하지 않는 경우 (맵에서 찾지 못한 경우)
		if (itemDto == null) {
			throw new CustomException(ErrorCode.ITEM_NOT_FOUND);
		}

		// 상품이 삭제되었거나 비활성 상태인 경우
		if (!itemDto.getStatus()) {
			throw new CustomException(ErrorCode.ITEM_UNAVAILABLE);
		}

		// 재고가 부족한 경우 (실시간 재고 정보 사용)
		if (availableQuantity < requestItem.getQuantity()) {
			log.warn("재고 부족: 상품ID={}, 요청={}, 실시간 가용={}",
				itemDto.getItemId(), requestItem.getQuantity(), availableQuantity);
			throw new CustomException(ErrorCode.ITEM_INSUFFICIENT_STOCK);
		}

		// 가격이 일치하지 않는 경우
		if (!itemDto.getPrice().equals(requestItem.getPrice())) {
			log.warn("가격 불일치: 상품ID={}, 요청가격={}, DB가격={}",
				itemDto.getItemId(), requestItem.getPrice(), itemDto.getPrice());
			throw new CustomException(ErrorCode.ITEM_PRICE_MISMATCH);
		}
	}
}
