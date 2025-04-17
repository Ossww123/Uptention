package com.otoki.uptention.infra.image.service;

import org.springframework.web.multipart.MultipartFile;

public interface ImageUploadService {
	String uploadImage(MultipartFile file);

	String getImageUrl(String key);

	void removeImage(String key);
}
