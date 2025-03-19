package com.otoki.uptention.domain.item.entity;

import java.util.ArrayList;
import java.util.List;

import com.otoki.uptention.domain.category.entity.Category;
import com.otoki.uptention.domain.image.entity.Image;
import com.otoki.uptention.global.entity.TimeStampEntity;

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

	@Column(name = "name", length = 31)
	private String name;

	@Column(name = "detail", length = 255)
	private String detail;

	@Column(name = "price")
	private Integer price;

	@Column(name = "brand", length = 31)
	private String brand;

	@Column(name = "status")
	private Boolean status;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "category_id")
	private Category category;

	@OneToMany(mappedBy = "item")
	@Builder.Default
	private List<Image> images = new ArrayList<>();
}