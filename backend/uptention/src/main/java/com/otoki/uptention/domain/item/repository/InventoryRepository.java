package com.otoki.uptention.domain.item.repository;

import org.springframework.stereotype.Repository;

/**
 * 재고 관련 레포지토리
 * 필요한 경우 Redis 외에 다른 저장소도 활용할 수 있도록 인터페이스로 정의
 */
@Repository
public interface InventoryRepository {
	// 현재는 Redis를 직접 사용하므로 비어있음
	// 추후 확장 가능성을 위해 인터페이스 정의
}
