package com.otoki.uptention.application.item.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.item.dto.request.ItemCreateRequestDto;
import com.otoki.uptention.application.item.dto.request.ItemUpdateRequestDto;
import com.otoki.uptention.application.item.dto.response.ItemCursorResponseDto;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.domain.category.entity.Category;
import com.otoki.uptention.domain.category.service.CategoryService;
import com.otoki.uptention.domain.common.CursorDto;
import com.otoki.uptention.domain.image.entity.Image;
import com.otoki.uptention.domain.item.dto.InventoryDto;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.enums.SortType;
import com.otoki.uptention.domain.item.service.InventoryService;
import com.otoki.uptention.domain.item.service.ItemService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.otoki.uptention.infra.image.service.ImageUploadService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
@Slf4j
public class ItemAppServiceImpl implements ItemAppService {

	private final ItemService itemService;
	private final CategoryService categoryService;
	private final ImageUploadService imageUploadService;
	private final InventoryService inventoryService;

	/**
	 * 상품 등록
	 */
	@Override
	@Transactional
	public Item createItem(ItemCreateRequestDto itemCreateRequestDto, List<MultipartFile> images) {
		// 이미지 개수 검증 (1~3개)
		if (images.isEmpty() || images.size() > 3) {
			throw new CustomException(ErrorCode.ITEM_IMAGE_COUNT_INVALID);
		}

		// 카테고리 검증
		Category category = categoryService.getCategoryById(itemCreateRequestDto.getCategoryId());

		// Item 객체 생성
		Item item = Item.builder()
			.name(itemCreateRequestDto.getName())
			.detail(itemCreateRequestDto.getDetail())
			.price(itemCreateRequestDto.getPrice())
			.brand(itemCreateRequestDto.getBrand())
			.quantity(itemCreateRequestDto.getQuantity())
			.category(category)
			.build();

		// 이미지 업로드와 Image 객체 생성을 한 번의 순회로 처리
		List<Image> imageEntities = images.stream()
			.map(file -> {
				String imageKey = imageUploadService.uploadImage(file);
				return Image.builder()
					.url(imageKey)
					.item(item)
					.build();
			})
			.toList();

		// 이미지 목록 설정
		item.getImages().addAll(imageEntities);

		// 아이템 저장
		Item savedItem = itemService.saveItem(item);

		// Redis 재고 초기화
		inventoryService.initializeInventory(savedItem.getId(), savedItem.getQuantity());

		return savedItem;
	}

	/**
	 * 상품 삭제
	 */
	@Override
	@Transactional
	public void deleteItem(Integer itemId) {
		Item item = itemService.getItemById(itemId);
		item.updateStatus(false); // 상품 비활성화

		// Redis 재고 업데이트 (비활성화된 상품은 재고를 0으로 설정)
		try {
			inventoryService.updateInventory(itemId, 0);
		} catch (Exception e) {
			log.error("Failed to update Redis inventory for deleted item {}", itemId, e);
			// 메인 기능(삭제)은 성공했으므로 Redis 실패는 로깅만 하고 넘어감
		}
	}

	/**
	 * 상품 정보 수정
	 */
	@Override
	@Transactional
	public void updateItem(Integer itemId, ItemUpdateRequestDto itemUpdateRequestDto) {
		// 1. 유효한 변경사항 존재 여부 확인
		// DTO에서 @Min, @Max 등으로 값 유효성은 이미 검증됨
		boolean isDetailPresent = itemUpdateRequestDto.getDetail() != null;
		boolean isPricePresent = itemUpdateRequestDto.getPrice() != null;
		boolean isQuantityPresent = itemUpdateRequestDto.getQuantity() != null;

		// 빈 문자열 추가 검증 (Bean Validation으로는 빈 문자열 검증 불가)
		if (isDetailPresent && itemUpdateRequestDto.getDetail().trim().isEmpty()) {
			isDetailPresent = false;
		}

		boolean hasValidChanges = isPricePresent || isDetailPresent || isQuantityPresent;

		if (!hasValidChanges) {
			throw new CustomException(ErrorCode.ITEM_UPDATE_NO_CHANGES);
		}

		// 2. 상품 조회 (존재 여부와 상태 확인)
		Item item = itemService.getItemById(itemId);

		// 3. 필드별 업데이트
		if (isPricePresent) {
			item.updatePrice(itemUpdateRequestDto.getPrice());
		}

		if (isDetailPresent) {
			item.updateDetail(itemUpdateRequestDto.getDetail());
		}

		if (isQuantityPresent) {
			try {
				// Redis 재고 업데이트
				inventoryService.updateInventory(itemId, itemUpdateRequestDto.getQuantity());
				item.updateQuantity(itemUpdateRequestDto.getQuantity());
				log.info("Successfully updated inventory for item {} to quantity {}",
					itemId, itemUpdateRequestDto.getQuantity());

			} catch (Exception e) {
				log.error("Failed to update Redis inventory for item {}", itemId, e);
				// Redis 업데이트 실패 시 트랜잭션 롤백을 위해 예외 다시 던지기
				throw new CustomException(ErrorCode.INVENTORY_UPDATE_FAILED);
			}
		}
	}

	/**
	 * 상품의 상세 정보 조회
	 */
	@Override
	public ItemResponseDto getItemDetails(Integer itemId) {
		// 1. MySQL에서 상품 기본 정보 조회
		Item item = itemService.getItemById(itemId);

		// 이미지 URL 변환 처리
		List<String> imageUrls = item.getImages().stream()
			.map(image -> imageUploadService.getImageUrl(image.getUrl()))
			.toList();

		// 2. Redis에서 최신 재고 정보 조회 시도
		try {
			// Redis에서 재고 정보 가져오기
			InventoryDto inventory = inventoryService.getInventory(itemId);

			// 최신 재고 정보를 반영한 임시 Item 객체 생성
			Item updatedItem = Item.builder()
				.id(item.getId())
				.name(item.getName())
				.detail(item.getDetail())
				.price(item.getPrice())
				.brand(item.getBrand())
				.status(item.getStatus())
				.quantity(inventory.getAvailableQuantity()) // 실시간 가용 재고 정보 제공
				.salesCount(item.getSalesCount())
				.category(item.getCategory())
				.images(item.getImages())
				.build();

			return ItemResponseDto.from(updatedItem, imageUrls);
		} catch (Exception e) {
			// Redis 조회 실패 시 MySQL 데이터만으로 응답
			log.warn("Failed to get inventory from Redis for item {}, using database value: {}",
				itemId, e.getMessage());
			return ItemResponseDto.from(item, imageUrls);
		}
	}

	/**
	 * 조건에 맞는 상품 목록을 커서 기반 페이징으로 조회
	 */
	@Override
	public ItemCursorResponseDto getItems(Integer categoryId, String keyword, String cursorStr,
		SortType sortType, int size) {

		// 카테고리 존재 여부 검증
		if (categoryId != null && !categoryService.isCategoryExists(categoryId)) {
			throw new CustomException(ErrorCode.ITEM_CATEGORY_NOT_FOUND);
		}

		// 커서 디코딩
		CursorDto<Integer> cursor = CursorDto.decode(cursorStr, Integer.class);

		// 아이템 조회 (size + 1개를 조회하여 다음 페이지 여부 확인)
		List<ItemDto> items = itemService.getItemsByCursor(categoryId, keyword, cursor, sortType, size + 1);

		// 다음 페이지 여부 확인
		boolean hasNextPage = items.size() > size;

		// 요청한 size만큼만 반환
		List<ItemDto> resultItems = hasNextPage ? items.subList(0, size) : items;

		// Redis에서 실시간 재고 정보 조회하여 업데이트
		updateItemsWithRealTimeInventory(resultItems);

		// 각 아이템의 thumbnail(이미지 키)을 완전한 URL로 변환
		resultItems.forEach(item -> {
			if (item.getThumbnail() != null && !item.getThumbnail().isEmpty()) {
				// 썸네일 이미지 키를 완전한 URL로 변환
				String fullImageUrl = imageUploadService.getImageUrl(item.getThumbnail());
				item.setThumbnail(fullImageUrl);
			}
		});

		// 다음 커서 생성
		String nextCursor = hasNextPage && !resultItems.isEmpty()
			? createNextCursor(resultItems.get(resultItems.size() - 1), sortType)
			: null;

		return new ItemCursorResponseDto(resultItems, hasNextPage, nextCursor);
	}

	/**
	 * 다음 페이지 조회를 위한 커서 생성
	 */
	private String createNextCursor(ItemDto lastItem, SortType sortType) {
		Integer value;

		if (sortType == SortType.SALES) {
			value = lastItem.getSalesCount();
		} else if (sortType == SortType.HIGH_PRICE || sortType == SortType.LOW_PRICE) {
			value = lastItem.getPrice();
		} else if (sortType == SortType.ID_ASC) {
			value = lastItem.getItemId();
		} else {
			throw new CustomException(ErrorCode.ITEM_INVALID_SORT_TYPE);
		}

		return new CursorDto<>(value, lastItem.getItemId()).encode();
	}

	/**
	 * 아이템 목록의 재고 정보를 Redis의 실시간 정보로 업데이트
	 */
	private void updateItemsWithRealTimeInventory(List<ItemDto> items) {
		if (items.isEmpty()) {
			return;
		}

		// 모든 아이템 ID 추출
		List<Integer> itemIds = items.stream()
			.map(ItemDto::getItemId)
			.collect(Collectors.toList());

		try {
			// Redis에서 재고 정보 일괄 조회
			Map<Integer, InventoryDto> inventories = inventoryService.getInventories(itemIds);

			// 각 아이템에 실시간 재고 정보 반영
			for (ItemDto item : items) {
				InventoryDto inventory = inventories.get(item.getItemId());
				if (inventory != null) {
					// 가용 재고로 업데이트 (실제 구매 가능 수량)
					item.setQuantity(inventory.getAvailableQuantity());
				}
			}
		} catch (Exception e) {
			// Redis 조회 실패 시 DB 재고 정보 유지
			log.warn("Failed to update items with real-time inventory: {}", e.getMessage());
		}
	}
}