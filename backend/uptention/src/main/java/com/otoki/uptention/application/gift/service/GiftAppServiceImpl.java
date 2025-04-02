package com.otoki.uptention.application.gift.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.gift.dto.response.GiftHistoryCursorResponseDto;
import com.otoki.uptention.application.gift.dto.response.GiftItemResponseDto;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.order.dto.GiftItemDto;
import com.otoki.uptention.domain.order.enums.GiftStatus;
import com.otoki.uptention.domain.order.service.GiftService;
import com.otoki.uptention.domain.user.entity.User;

import lombok.RequiredArgsConstructor;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GiftAppServiceImpl implements GiftAppService {

	private final GiftService giftService;
	private final SecurityService securityService;

	@Override
	public GiftHistoryCursorResponseDto getGiftHistory(String cursorStr, int size, GiftStatus type) {
		User user = securityService.getLoggedInUser();

		// 선물 목록 조회
		List<GiftItemDto> giftItems = fetchGiftsByStatus(user.getId(), cursorStr, size + 1, type);

		// 페이지네이션 처리 및 응답 생성
		return createGiftHistoryResponse(giftItems, size);
	}

	/**
	 * 상태에 따른 선물 목록 조회
	 */
	private List<GiftItemDto> fetchGiftsByStatus(Integer userId, String cursorStr, int limit, GiftStatus status) {
		CursorDto cursor = CursorDto.decode(cursorStr);

		if (cursor == null) {
			// 첫 페이지 조회
			return giftService.getReceivedGiftsByStatusWithLimit(userId, status, limit);
		} else {
			// 다음 페이지 조회
			return giftService.getReceivedGiftsByStatusAfterCursor(userId, status, cursor.getId(), limit);
		}
	}

	/**
	 * 선물 내역 응답 생성
	 */
	private GiftHistoryCursorResponseDto createGiftHistoryResponse(List<GiftItemDto> giftItems, int size) {
		// 다음 페이지 여부 확인
		boolean hasNextPage = giftItems.size() > size;

		// 요청한 size만큼만 사용
		List<GiftItemDto> resultItems = hasNextPage ? giftItems.subList(0, size) : giftItems;

		if (resultItems.isEmpty()) {
			return GiftHistoryCursorResponseDto.builder()
				.giftItems(List.of())
				.hasNextPage(false)
				.nextCursor(null)
				.build();
		}

		// DTO 변환
		List<GiftItemResponseDto> giftItemDtos = convertToGiftItemResponseDtos(resultItems);

		// 다음 커서 생성
		String nextCursor = createNextCursor(hasNextPage, resultItems);

		return GiftHistoryCursorResponseDto.builder()
			.giftItems(giftItemDtos)
			.hasNextPage(hasNextPage)
			.nextCursor(nextCursor)
			.build();
	}

	/**
	 * 선물 항목 DTO 변환
	 */
	private List<GiftItemResponseDto> convertToGiftItemResponseDtos(List<GiftItemDto> resultItems) {
		return resultItems.stream()
			.map(item -> GiftItemResponseDto.builder()
				.giftId(item.getGiftId())
				.orderId(item.getOrderId())
				.itemName(item.getItemName())
				.brand(item.getBrand())
				.status(item.getStatus().getDescription())
				.receivedDate(item.getReceivedDate())
				.imageUrl(item.getImageUrl())
				.senderId(item.getSenderId())
				.senderName(item.getSenderName())
				.address(item.getAddress())
				.build())
			.collect(Collectors.toList());
	}

	/**
	 * 다음 커서 생성
	 */
	private String createNextCursor(boolean hasNextPage, List<GiftItemDto> resultItems) {
		if (hasNextPage && !resultItems.isEmpty()) {
			GiftItemDto lastItem = resultItems.get(resultItems.size() - 1);
			CursorDto nextCursorDto = new CursorDto(0, lastItem.getGiftId());
			return nextCursorDto.encode();
		}
		return null;
	}
}