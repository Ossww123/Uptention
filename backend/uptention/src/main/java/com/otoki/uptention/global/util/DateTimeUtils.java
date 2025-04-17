package com.otoki.uptention.global.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

public class DateTimeUtils {

	/**
	 * fromZone에서 toZone으로 instant 동기 변환
	 */
	public static LocalDateTime convert(
		LocalDateTime dateTime,
		ZoneId fromZone,
		ZoneId toZone
	) {
		return dateTime
			.atZone(fromZone)
			.withZoneSameInstant(toZone)
			.toLocalDateTime();
	}

	/**
	 * 특정 Zone(local) → UTC
	 */
	public static LocalDateTime toUtc(
		LocalDateTime localDateTime,
		ZoneId localZone
	) {
		return convert(localDateTime, localZone, ZoneOffset.UTC);
	}

	/**
	 * UTC → 특정 Zone(local)
	 */
	public static LocalDateTime fromUtc(
		LocalDateTime utcDateTime,
		ZoneId targetZone
	) {
		return convert(utcDateTime, ZoneOffset.UTC, targetZone);
	}
}
