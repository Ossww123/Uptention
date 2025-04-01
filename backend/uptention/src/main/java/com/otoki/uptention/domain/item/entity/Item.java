package com.otoki.uptention.domain.item.entity;

import java.util.ArrayList;
import java.util.List;

import com.otoki.uptention.domain.category.entity.Category;
import com.otoki.uptention.domain.image.entity.Image;
import com.otoki.uptention.global.entity.TimeStampEntity;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "item")
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@Getter
public class Item extends TimeStampEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "name", length = 255)
	private String name;

	@Column(name = "detail", length = 255)
	private String detail;

	@Column(name = "price")
	private Integer price;

	@Column(name = "brand", length = 31)
	private String brand;

	@Builder.Default
	@Column(name = "status")
	private Boolean status = true;

	@Column(name = "quantity")
	private Integer quantity;

	@Builder.Default
	@Column(name = "sales_count")
	private Integer salesCount = 0;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "category_id")
	private Category category;

	@OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
	@Builder.Default
	private List<Image> images = new ArrayList<>();

	// 판매량 증가 메서드
	public void increaseSalesCount(int quantity) {
		this.salesCount += quantity;
	}

	// 재고 감소 메서드
	public void decreaseQuantity(int quantity) {
		if (this.quantity < quantity) {
			throw new CustomException(ErrorCode.ITEM_NO_STOCK_TO_DECREASE);
		}
		this.quantity -= quantity;
	}

	// 재고 증가 메서드
	public void increaseQuantity(int quantity) {
		this.quantity += quantity;
	}

	// 재고 확인 메서드
	public boolean hasStock(int quantity) {
		return this.quantity >= quantity;
	}

	// 상품 상태 업데이트 메서드
	public void updateStatus(Boolean status) {
		this.status = status;
	}

	// 가격 업데이트 메서드
	public void updatePrice(Integer price) {
		this.price = price;
	}

	// 상품 설명 업데이트 메서드
	public void updateDetail(String detail) {
		this.detail = detail;
	}

	// 수량 업데이트 메서드 (기존 증가/감소 메서드와 별개)
	public void updateQuantity(Integer quantity) {
		this.quantity = quantity;
	}
}