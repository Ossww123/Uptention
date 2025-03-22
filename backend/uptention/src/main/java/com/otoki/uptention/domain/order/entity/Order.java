package com.otoki.uptention.domain.order.entity;

import com.otoki.uptention.domain.gift.entity.Gift;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.global.entity.TimeStampEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "item_id", nullable = false)
	private Item item;

	@Column(length = 127)
	private String address;

	private Integer quantity;

	@Column(name = "total_price")
	private Integer totalPrice;

	@OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
	private Gift gift;
}
