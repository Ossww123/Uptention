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
			Image image = Image.builder()
				.url("http://example.com/image" + (i + 1) + ".jpg")
				.item(item)
				.build();

			// Image를 Item의 images 컬렉션에도 추가
			item.getImages().add(image);

			images.add(imageRepository.save(image));
		}

		// 변경사항 저장
		itemRepository.save(item);
		return item.getImages();
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

	@Test
	@DisplayName("상품 ID로 조회할 때 활성화된 상품이 존재하지 않으면 빈 Optional을 반환한다")
	void findActiveByIdWithImages_NotFound() {
		// given
		Integer nonExistentItemId = 999; // 존재하지 않는 상품 ID

		// when
		Optional<Item> foundItem = itemRepository.findActiveByIdWithImages(nonExistentItemId);

		// then
		assertThat(foundItem).isNotPresent(); // 빈 Optional이어야 함
	}

}
