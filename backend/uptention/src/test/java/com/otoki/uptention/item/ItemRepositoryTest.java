package com.otoki.uptention.item;

import static org.assertj.core.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.otoki.uptention.RepositoryTestSupport;
import com.otoki.uptention.domain.category.entity.Category;
import com.otoki.uptention.domain.category.repository.CategoryRepository;
import com.otoki.uptention.domain.image.entity.Image;
import com.otoki.uptention.domain.image.repository.ImageRepository;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.repository.ItemRepository;

public class ItemRepositoryTest extends RepositoryTestSupport {

	@Autowired
	private ItemRepository itemRepository;

	@Autowired
	private CategoryRepository categoryRepository;

	@Autowired
	private ImageRepository imageRepository;

	// 헬퍼 메서드들
	private Category createCategory() {
		return categoryRepository.save(
			Category.builder()
				.name("테스트 카테고리")
				.build()
		);
	}

	private Item createItem(boolean isActive, Category category) {
		return itemRepository.save(
			Item.builder()
				.name("테스트 상품")
				.detail("상품 설명")
				.price(10000)
				.brand("테스트 브랜드")
				.status(isActive)
				.category(category)
				.build()
		);
	}

	private List<Image> createImages(Item item, int count) {
		List<Image> images = new ArrayList<>();
		for (int i = 0; i < count; i++) {
			Image image = imageRepository.save(
				Image.builder()
					.url("http://example.com/image" + (i + 1) + ".jpg")
					.build()
			);
			images.add(image);
		}

		// 이미지를 아이템에 연결하고 다시 저장
		item.getImages().addAll(images);
		itemRepository.save(item);

		return images;
	}

	@Test
	@DisplayName("상품 ID로 조회할 때 활성화된 상품은 모든 이미지와 함께 조회된다")
	void findActiveByIdWithImages_Success() {
		// given
		Category category = createCategory();
		Item activeItem = createItem(true, category);
		List<Image> images = createImages(activeItem, 3);

		// when
		Optional<Item> foundItem = itemRepository.findActiveByIdWithImages(activeItem.getId());

		// then
		assertThat(foundItem).isPresent();
		assertThat(foundItem.get().getId()).isEqualTo(activeItem.getId());
		assertThat(foundItem.get().getStatus()).isTrue();
		assertThat(foundItem.get().getImages()).hasSize(3);
	}

}
