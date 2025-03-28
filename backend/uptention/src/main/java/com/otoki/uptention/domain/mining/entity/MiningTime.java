package com.otoki.uptention.domain.mining.entity;

import java.time.LocalDateTime;

import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.global.entity.TimeStampEntity;

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
@Table(name = "mining_time")
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Builder
public class MiningTime extends TimeStampEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	private LocalDateTime startTime;

	private LocalDateTime endTime;

	public void updateEndTime(LocalDateTime endTime) {
		this.endTime = endTime;
	}

}
