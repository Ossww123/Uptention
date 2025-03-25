package com.otoki.uptention.item;

import static org.assertj.core.api.Assertions.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.otoki.uptention.RepositoryTestSupport;
import com.otoki.uptention.domain.category.entity.Category;
import com.otoki.uptention.domain.category.repository.CategoryRepository;
import com.otoki.uptention.domain.image.entity.Image;
import com.otoki.uptention.domain.image.repository.ImageRepository;
import com.otoki.uptention.domain.item.dto.ItemDto;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.repository.ItemRepository;

public class ItemRepositoryCustomTest extends RepositoryTestSupport {

	@Autowired
	private ItemRepository itemRepository;

	@Autowired
	private CategoryRepository categoryRepository;

	@Autowired
	private ImageRepository imageRepository;

	@DisplayName("상품 ID 목록으로 상품과 첫 번째 이미지만 조회한다.")
	@Test
	void findItemsWithThumbnailByIds_Success() {
		// given
		Category category = createCategory("테스트 카테고리");

		Item item1 = createItem("상품1", 10000, 10, true, category);
		Item item2 = createItem("상품2", 20000, 20, true, category);
		Item item3 = createItem("상품3", 30000, 30, false, category); // 비활성 상품

		// 각 상품당 여러 이미지 생성
		List<Image> images1 = createImages(item1, 3); // 3개 이미지
		List<Image> images2 = createImages(item2, 2); // 2개 이미지
		List<Image> images3 = createImages(item3, 1); // 1개 이미지

		List<Integer> itemIds = Arrays.asList(item1.getId(), item2.getId(), item3.getId());

		// when
		List<ItemDto> result = itemRepository.findItemsWithThumbnailByIds(itemIds);

		// then
		assertThat(result).hasSize(3); // 모든 상품 조회 (status에 관계없이)

		// ID로 빠르게 접근할 수 있도록 Map 생성
		Map<Integer, ItemDto> resultMap = result.stream()
			.collect(Collectors.toMap(ItemDto::getItemId, dto -> dto));

		// 상품1 검증
		ItemDto item1Dto = resultMap.get(item1.getId());
		assertThat(item1Dto).isNotNull();
		assertThat(item1Dto.getName()).isEqualTo("상품1");
		assertThat(item1Dto.getPrice()).isEqualTo(10000);
		assertThat(item1Dto.getQuantity()).isEqualTo(10);
		assertThat(item1Dto.getStatus()).isTrue();
		assertThat(item1Dto.getThumbnail()).isEqualTo("http://example.com/image1.jpg"); // 첫 번째 이미지만 가져와야 함

		// 상품2 검증
		ItemDto item2Dto = resultMap.get(item2.getId());
		assertThat(item2Dto).isNotNull();
		assertThat(item2Dto.getName()).isEqualTo("상품2");
		assertThat(item2Dto.getPrice()).isEqualTo(20000);
		assertThat(item2Dto.getQuantity()).isEqualTo(20);
		assertThat(item2Dto.getStatus()).isTrue();
		assertThat(item2Dto.getThumbnail()).isEqualTo("http://example.com/image1.jpg"); // 첫 번째 이미지만 가져와야 함

		// 상품3 검증 (비활성화된 상품)
		ItemDto item3Dto = resultMap.get(item3.getId());
		assertThat(item3Dto).isNotNull();
		assertThat(item3Dto.getName()).isEqualTo("상품3");
		assertThat(item3Dto.getPrice()).isEqualTo(30000);
		assertThat(item3Dto.getQuantity()).isEqualTo(30);
		assertThat(item3Dto.getStatus()).isFalse(); // 비활성 상태
		assertThat(item3Dto.getThumbnail()).isEqualTo("http://example.com/image1.jpg"); // 첫 번째 이미지만 가져와야 함
	}

	@DisplayName("일부 상품 ID가 존재하지 않는 경우 존재하는 상품만 조회한다.")
	@Test
	void findItemsWithThumbnailByIds_PartiallyExisting() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item item = createItem("상품1", 10000, 10, true, category);
		List<Image> images = createImages(item, 2);

		List<Integer> itemIds = Arrays.asList(item.getId(), 999); // 999는 존재하지 않는 ID

		// when
		List<ItemDto> result = itemRepository.findItemsWithThumbnailByIds(itemIds);

		// then
		assertThat(result).hasSize(1); // 존재하는 상품만 조회됨
		assertThat(result.get(0).getItemId()).isEqualTo(item.getId());
		assertThat(result.get(0).getThumbnail()).isEqualTo("http://example.com/image1.jpg");
	}

	@DisplayName("빈 ID 목록으로 조회하면 빈 목록을 반환한다.")
	@Test
	void findItemsWithThumbnailByIds_EmptyList() {
		// when
		List<ItemDto> result = itemRepository.findItemsWithThumbnailByIds(List.of());

		// then
		assertThat(result).isEmpty();
	}

	@DisplayName("null ID 목록으로 조회하면 빈 목록을 반환한다.")
	@Test
	void findItemsWithThumbnailByIds_NullList() {
		// when
		List<ItemDto> result = itemRepository.findItemsWithThumbnailByIds(null);

		// then
		assertThat(result).isEmpty();
	}

	// 헬퍼 메서드들
	private Category createCategory(String name) {
		return categoryRepository.save(
			Category.builder()
				.name(name)
				.build()
		);
	}

	private Item createItem(String name, int price, int quantity, boolean isActive, Category category) {
		return itemRepository.save(
			Item.builder()
				.name(name)
				.detail("상품 설명")
				.price(price)
				.brand("테스트 브랜드")
				.status(isActive)
				.quantity(quantity)
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
		return images;
	}
}
