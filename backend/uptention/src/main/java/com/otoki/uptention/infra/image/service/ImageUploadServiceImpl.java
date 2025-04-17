package com.otoki.uptention.infra.image.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.global.config.AwsS3Properties;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.otoki.uptention.infra.image.util.ImageValidationUtil;

import io.awspring.cloud.s3.ObjectMetadata;
import io.awspring.cloud.s3.S3Template;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ImageUploadServiceImpl implements ImageUploadService {
	private final S3Template s3Template;
	private final AwsS3Properties awsS3Properties;

	/**
	 * 1) 파일을 S3에 업로드.
	 * 2) 생성된 파일 Key(=UUID+확장자)만 반환
	 */
	@Override
	public String uploadImage(MultipartFile file) {
		ImageValidationUtil.validateFile(file);

		// 1) UUID+확장자로 Key 생성
		String key = createUniqueFileName(file);

		// 2) 메타데이터 설정
		ObjectMetadata metadata = ObjectMetadata.builder()
			.contentType(file.getContentType())
			.build();

		// 3) 업로드, Try-with-resources 방식
		try (InputStream inputStream = file.getInputStream()) {
			s3Template.upload(awsS3Properties.getBucket(), key, inputStream, metadata);
		} catch (IOException ex) {
			throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR);
		}

		// 업로드 후 key 반환
		return key;
	}

	@Override
	public String getImageUrl(String key) {
		// CloudFront 도메인을 이용해 접근 URL 생성
		// ex) https://{cloudfront-domain}/{key}
		return "https://" + awsS3Properties.getCloudfrontDomain() + "/" + key;
	}

	@Override
	public void removeImage(String key) {
		s3Template.deleteObject(awsS3Properties.getBucket(), key);
	}

	private String createUniqueFileName(MultipartFile file) {
		String originalFilename = file.getOriginalFilename();
		String extension = "";
		if (originalFilename != null) {
			int dotIndex = originalFilename.lastIndexOf(".");
			if (dotIndex != -1) {
				extension = originalFilename.substring(dotIndex);
			}
		}
		String uuid = UUID.randomUUID().toString();
		return uuid + extension;
	}
}
