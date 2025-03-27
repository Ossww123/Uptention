package com.otoki.uptention.global.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.global.config.AwsS3Properties;
import com.otoki.uptention.global.exception.CustomException;

import io.awspring.cloud.s3.S3Template;

@ExtendWith(MockitoExtension.class)
public class ImageUploadServiceImplTest {

	@Mock
	private S3Template s3Template;

	@Mock
	private AwsS3Properties awsS3Properties;

	@InjectMocks
	private ImageUploadServiceImpl imageUploadService;

	@Test
	@DisplayName("유효한 이미지 파일 업로드 시 S3에 업로드되고 key를 반환한다")
	void uploadImage_ValidFile_Success() throws IOException {
		// given
		String bucket = "test-bucket";
		String cloudfrontDomain = "d1234567890.cloudfront.net";
		// lenient()를 사용하여 불필요한 스터빙 경고를 피함
		lenient().when(awsS3Properties.getBucket()).thenReturn(bucket);
		lenient().when(awsS3Properties.getCloudfrontDomain()).thenReturn(cloudfrontDomain);

		// JPEG 파일은 보통 FF D8 FF로 시작함 (8바이트 헤더로 충분)
		byte[] jpegHeader = {(byte)0xFF, (byte)0xD8, (byte)0xFF, 0x00, 0x00, 0x00, 0x00, 0x00};
		MultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg",
			new ByteArrayInputStream(jpegHeader));

		// s3Template.upload()의 반환 타입은 S3Resource, 사용하지 않으므로 null 반환하도록 스터빙
		when(s3Template.upload(eq(bucket), anyString(), any(), any())).thenReturn(null);

		// when
		String key = imageUploadService.uploadImage(file);

		// then
		assertThat(key).isNotNull();
		// 생성된 key는 UUID + 확장자(.jpg) 형식이어야 함
		assertThat(key).endsWith(".jpg");
		verify(s3Template, times(1)).upload(eq(bucket), eq(key), any(), any());
	}

	@Test
	@DisplayName("파일 InputStream 읽기 실패 시 CustomException을 던진다")
	void uploadImage_FileInputStreamFails_ThrowsCustomException() throws IOException {
		// given
		String bucket = "test-bucket";
		// lenient()로 awsS3Properties 스터빙은 불필요한 스터빙 경고를 피함 (해당 스터빙은 실제 호출되지 않을 수 있음)
		lenient().when(awsS3Properties.getBucket()).thenReturn(bucket);

		// 빈 파일이 아님을 가정하여 모의 MultipartFile 생성
		MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
		when(file.isEmpty()).thenReturn(false);
		when(file.getOriginalFilename()).thenReturn("test.jpg");
		when(file.getContentType()).thenReturn("image/jpeg");
		when(file.getSize()).thenReturn(1000L);
		// InputStream 호출 시 IOException 발생하도록 스터빙
		when(file.getInputStream()).thenThrow(new IOException("Test IOException"));

		// when & then
		assertThatThrownBy(() -> imageUploadService.uploadImage(file))
			.isInstanceOf(CustomException.class);
	}
}
