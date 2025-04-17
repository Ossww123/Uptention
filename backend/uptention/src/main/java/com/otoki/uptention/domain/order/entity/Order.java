package com.otoki.uptention.domain.order.entity;

import com.otoki.uptention.domain.order.enums.OrderStatus;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.global.entity.TimeStampEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "orders")
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Builder
public class Order extends TimeStampEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(length = 127)
	private String address;

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(length = 20, nullable = false)
	private OrderStatus status = OrderStatus.PAYMENT_PENDING;

	@OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
	private Gift gift;

	// 배송지 정보를 설정하거나 수정
	public Order updateAddress(String address) {
		this.address = address;
		return this;
	}

	// 주문 상태 업데이트
	public Order updateStatus(OrderStatus status) {
		this.status = status;
		return this;
	}
}
