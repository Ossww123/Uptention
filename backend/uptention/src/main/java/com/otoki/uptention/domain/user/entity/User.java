package com.otoki.uptention.domain.user.entity;

import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.global.entity.TimeStampEntity;

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
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "`user`")
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Builder
public class User extends TimeStampEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(length = 31)
	private String username;

	@Column(length = 100)
	private String password;

	@Column(length = 31)
	private String name;

	@Column(name = "employee_number", length = 31)
	private String employeeNumber;

	@Enumerated(EnumType.STRING)
	@Column(name = "role", length = 31)
	private UserRole role;

	@Column(length = 255)
	private String wallet;

	private Integer point;

	@Column(name = "profile_image", length = 255)
	private String profileImage;

	private Boolean status;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "company_id", nullable = false)
	private Company company;

}