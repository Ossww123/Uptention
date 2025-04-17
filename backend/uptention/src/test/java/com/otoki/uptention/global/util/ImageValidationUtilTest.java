package com.otoki.uptention.global.util;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.otoki.uptention.infra.image.util.ImageValidationUtil;

public class ImageValidationUtilTest {

	@Test
	@DisplayName("유효한 JPEG 파일은 예외 없이 통과한다")
	void validateFile_ValidJPEG() throws IOException {
		// JPEG 파일 헤더: FF D8 FF, 나머지는 임의의 값으로 채움 (총 8바이트)
		byte[] jpegHeader = {(byte)0xFF, (byte)0xD8, (byte)0xFF, 0x00, 0x00, 0x00, 0x00, 0x00};
		MultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg",
			new ByteArrayInputStream(jpegHeader));

		assertThatCode(() -> ImageValidationUtil.validateFile(file))
			.doesNotThrowAnyException();
	}

	@Test
	@DisplayName("빈 파일이면 FILE_EMPTY 에러가 발생한다")
	void validateFile_EmptyFile() {
		MultipartFile file = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);

		CustomException ex = assertThrows(CustomException.class, () -> ImageValidationUtil.validateFile(file));
		assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.FILE_EMPTY);
	}

	@Test
	@DisplayName("파일 크기가 5MB를 초과하면 FILE_TOO_LARGE 에러가 발생한다")
	void validateFile_FileTooLarge() {
		// 5MB + 1바이트
		byte[] largeContent = new byte[(int)(5 * 1024 * 1024) + 1];
		MultipartFile file = new MockMultipartFile("file", "large.jpg", "image/jpeg", largeContent);

		CustomException ex = assertThrows(CustomException.class, () -> ImageValidationUtil.validateFile(file));
		assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.FILE_TOO_LARGE);
	}

	@Test
	@DisplayName("잘못된 확장자를 가진 파일은 FILE_INVALID_EXTENSION 에러가 발생한다")
	void validateFile_InvalidExtension() throws IOException {
		byte[] content = "dummy content".getBytes(StandardCharsets.UTF_8);
		// 확장자가 .txt 로 되어 있음
		MultipartFile file = new MockMultipartFile("file", "test.txt", "image/jpeg", new ByteArrayInputStream(content));

		CustomException ex = assertThrows(CustomException.class, () -> ImageValidationUtil.validateFile(file));
		assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.FILE_INVALID_EXTENSION);
	}

	@Test
	@DisplayName("잘못된 MIME 타입을 가진 파일은 FILE_INVALID_MIME_TYPE 에러가 발생한다")
	void validateFile_InvalidMimeType() throws IOException {
		// 유효한 JPEG 확장자를 가지지만 MIME 타입이 text/plain
		byte[] jpegHeader = {(byte)0xFF, (byte)0xD8, (byte)0xFF, 0x00, 0x00, 0x00, (byte)0x00, (byte)0x00};
		MultipartFile file = new MockMultipartFile("file", "test.jpg", "text/plain",
			new ByteArrayInputStream(jpegHeader));

		CustomException ex = assertThrows(CustomException.class, () -> ImageValidationUtil.validateFile(file));
		assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.FILE_INVALID_MIME_TYPE);
	}

	@Test
	@DisplayName("잘못된 매직 넘버(파일 헤더)를 가진 파일은 FILE_INVALID_MAGIC 에러가 발생한다")
	void validateFile_InvalidMagicNumber() throws IOException {
		// 유효한 확장자와 MIME 타입을 갖지만, 헤더가 잘못된 경우 (모두 0으로 채움)
		byte[] invalidHeader = new byte[8]; // 8바이트 0
		MultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg",
			new ByteArrayInputStream(invalidHeader));

		CustomException ex = assertThrows(CustomException.class, () -> ImageValidationUtil.validateFile(file));
		assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.FILE_INVALID_MAGIC);
	}
}
