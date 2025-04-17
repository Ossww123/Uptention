package com.otoki.uptention.domain.item.service;

import java.util.List;
import java.util.Map;

import com.otoki.uptention.domain.item.dto.InventoryDto;

/**
 * 재고 관리 서비스 인터페이스
 * Redis 캐싱 및 분산락을 통한 재고 관리
 */
public interface InventoryService {
	// 상품 ID와 수량을 받아서 초기화하는 메서드 추가
	void initializeInventory(Integer itemId, Integer quantity);

	// 여러 상품 ID와 수량을 받아서 초기화하는 메서드
	void initializeInventories(Map<Integer, Integer> itemQuantities);

	// 단일 상품 재고 조회
	InventoryDto getInventory(Integer itemId);

	// 여러 상품 재고 조회
	Map<Integer, InventoryDto> getInventories(List<Integer> itemIds);

	// 재고 예약 (분산락 적용)
	boolean reserveInventory(Integer itemId, Integer quantity);

	// 개별 예약 확정
	boolean confirmInventory(Integer itemId, Integer quantity);

	// 예약 취소 (결제 실패 시)
	boolean cancelReservation(Integer itemId, Integer quantity);

	// 재고 업데이트
	void updateInventory(Integer itemId, Integer newQuantity);

	// 재고 증가
	void increaseInventory(Integer itemId, Integer quantity);

	// 재고 감소
	void decreaseInventory(Integer itemId, Integer quantity);

	// 재고 존재 확인
	boolean hasStock(Integer itemId, Integer quantity);

	boolean confirmInventories(Map<Integer, Integer> itemQuantities);

	boolean reserveInventories(Map<Integer, Integer> itemQuantities);

	boolean cancelReservations(Map<Integer, Integer> itemQuantities);
}
