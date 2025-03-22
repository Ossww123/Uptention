package com.otoki.uptention.domain.orderitem.entity;

import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.order.entity.Order;
import com.otoki.uptention.global.entity.TimeStampEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "order_item")
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Builder
public class OrderItem extends TimeStampEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id", nullable = false)
	private Order order;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "item_id", nullable = false)
	private Item item;

	@Column(nullable = false)
	private Integer quantity;

	@Column(name = "item_price")
	private Integer itemPrice;  // 주문 시점의 상품 가격

	// 총 가격 계산 메소드 (필요시 사용)
	public Integer getTotalPrice() {
		return this.itemPrice * this.quantity;
	}

	// Order 설정 메소드 (양방향 관계 설정용)
	public void createOrder(Order order) {
		this.order = order;
	}
}
