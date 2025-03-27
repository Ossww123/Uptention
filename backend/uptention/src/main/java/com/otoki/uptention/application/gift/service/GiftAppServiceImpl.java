package com.otoki.uptention.application.gift.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.otoki.uptention.application.gift.dto.response.GiftHistoryCursorResponseDto;
import com.otoki.uptention.application.gift.dto.response.GiftItemResponseDto;
import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.order.dto.GiftItemDto;
import com.otoki.uptention.domain.order.enums.GiftStatus;
import com.otoki.uptention.domain.order.service.GiftService;
import com.otoki.uptention.domain.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GiftAppServiceImpl implements GiftAppService {

	private final GiftService giftService;
	private final UserService userService;

	@Override
	public GiftHistoryCursorResponseDto getGiftHistory(String cursorStr, int size, GiftStatus type) {

		// 현재 로그인한 사용자 (임시로 ID 2 사용)
		Integer userId = 2; // 실제로는 SecurityContext에서 가져옴

		// 커서 디코딩
		CursorDto cursor = CursorDto.decode(cursorStr);

		// 선물 목록 조회
		List<GiftItemDto> giftItems;
		if (cursor == null) {
			// 첫 페이지 조회
			giftItems = giftService.getReceivedGiftsByStatusWithLimit(
				userId, type, size + 1);
		} else {
			// 다음 페이지 조회
			giftItems = giftService.getReceivedGiftsByStatusAfterCursor(
				userId, type, cursor.getId(), size + 1);
		}

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
		List<GiftItemResponseDto> giftItemDtos = resultItems.stream()
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
				.build())
			.collect(Collectors.toList());

		// 다음 커서 생성
		String nextCursor = null;
		if (hasNextPage && !resultItems.isEmpty()) {
			GiftItemDto lastItem = resultItems.get(resultItems.size() - 1);
			CursorDto nextCursorDto = new CursorDto(0, lastItem.getGiftId());
			nextCursor = nextCursorDto.encode();
		}

		return GiftHistoryCursorResponseDto.builder()
			.giftItems(giftItemDtos)
			.hasNextPage(hasNextPage)
			.nextCursor(nextCursor)
			.build();
	}
}