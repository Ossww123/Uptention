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
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

public class ItemRepositoryTest extends RepositoryTestSupport {

	@Autowired
	private ItemRepository itemRepository;

	@Autowired
	private CategoryRepository categoryRepository;

	@Autowired
	private ImageRepository imageRepository;

	@DisplayName("상품 ID로 기본 조회 시 상품의 활성화 상태와 관계없이 조회된다")
	@Test
	void findById_ReturnsItemRegardlessOfStatus() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item activeItem = createItem("활성화 상품", 10000, 10, true, category);
		Item inactiveItem = createItem("비활성화 상품", 10000, 10, false, category);

		// when
		Optional<Item> foundActiveItem = itemRepository.findById(activeItem.getId());
		Optional<Item> foundInactiveItem = itemRepository.findById(inactiveItem.getId());

		// then
		assertThat(foundActiveItem).isPresent();
		assertThat(foundActiveItem.get().getStatus()).isTrue();

		assertThat(foundInactiveItem).isPresent();
		assertThat(foundInactiveItem.get().getStatus()).isFalse();
	}

	@DisplayName("상품 ID로 조회할 때 활성화된 상품은 모든 이미지와 함께 조회된다")
	@Test
	void findActiveByIdWithImages_Success() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item activeItem = createItem("테스트 상품", 10000, 10, true, category);
		List<Image> images = createImages(activeItem, 3);

		// when
		Optional<Item> foundItem = itemRepository.findActiveByIdWithImages(activeItem.getId());

		// then
		assertThat(foundItem).isPresent();
		assertThat(foundItem.get().getId()).isEqualTo(activeItem.getId());
		assertThat(foundItem.get().getStatus()).isTrue();
		assertThat(foundItem.get().getImages()).hasSize(3)
			.extracting("url")
			.containsExactly(
				"http://example.com/image1.jpg",
				"http://example.com/image2.jpg",
				"http://example.com/image3.jpg"
			);
	}

	@DisplayName("상품 ID로 조회할 때 활성화된 상품이 존재하지 않으면 빈 Optional을 반환한다")
	@Test
	void findActiveByIdWithImages_NotFound() {
		// given
		Integer nonExistentItemId = 999; // 존재하지 않는 상품 ID

		// when
		Optional<Item> foundItem = itemRepository.findActiveByIdWithImages(nonExistentItemId);

		// then
		assertThat(foundItem).isEmpty();
	}

	@DisplayName("상품의 재고 수량을 감소시키면 정상적으로 반영된다")
	@Test
	void decreaseQuantity_Success() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item item = createItem("테스트 상품", 10000, 10, true, category); // 초기 재고 10

		// when
		item.decreaseQuantity(3); // 3개 감소
		itemRepository.save(item);

		// then
		Item foundItem = itemRepository.findById(item.getId()).orElseThrow();
		assertThat(foundItem.getQuantity()).isEqualTo(7); // 10 - 3 = 7
	}

	@DisplayName("재고보다 많은 수량을 감소시키려고 하면 예외가 발생한다")
	@Test
	void decreaseQuantity_ThrowsException_WhenInsufficientStock() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item item = createItem("테스트 상품", 10000, 5, true, category); // 초기 재고 5

		// when & then
		assertThatThrownBy(() -> item.decreaseQuantity(10)) // 10개 감소 시도
			.isInstanceOf(CustomException.class)
			.satisfies(exception -> {
				CustomException customException = (CustomException)exception;
				assertThat(customException.getErrorCode()).isEqualTo(ErrorCode.ITEM_NO_STOCK_TO_DECREASE);
			});
	}

	@DisplayName("상품의 재고 수량을 증가시키면 정상적으로 반영된다")
	@Test
	void increaseQuantity_Success() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item item = createItem("테스트 상품", 10000, 5, true, category); // 초기 재고 5

		// when
		item.increaseQuantity(10); // 10개 증가
		itemRepository.save(item);

		// then
		Item foundItem = itemRepository.findById(item.getId()).orElseThrow();
		assertThat(foundItem.getQuantity()).isEqualTo(15); // 5 + 10 = 15
	}

	@DisplayName("재고가 충분하면 hasStock이 true를 반환한다")
	@Test
	void hasStock_EnoughQuantity() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item item = createItem("테스트 상품", 10000, 10, true, category);

		// when & then
		assertThat(item.hasStock(5)).isTrue();
		assertThat(item.hasStock(10)).isTrue();
	}

	@DisplayName("재고가 부족하면 hasStock이 false를 반환한다")
	@Test
	void hasStock_NotEnoughQuantity() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item item = createItem("테스트 상품", 10000, 3, true, category);

		// when & then
		assertThat(item.hasStock(4)).isFalse();
	}

	@DisplayName("판매량이 증가하면 정상적으로 반영된다")
	@Test
	void increaseSalesCount_Success() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item item = createItem("테스트 상품", 10000, 10, true, category);
		int initialSalesCount = item.getSalesCount();

		// when
		item.increaseSalesCount(5);
		itemRepository.save(item);

		// then
		Item foundItem = itemRepository.findById(item.getId()).orElseThrow();
		assertThat(foundItem.getSalesCount()).isEqualTo(initialSalesCount + 5);
	}

	@DisplayName("비활성화된 상품은 조회되지 않는다")
	@Test
	void findActiveByIdWithImages_InactiveItem() {
		// given
		Category category = createCategory("테스트 카테고리");
		Item inactiveItem = createItem("비활성 상품", 10000, 10, false, category);
		createImages(inactiveItem, 2);

		// when
		Optional<Item> foundItem = itemRepository.findActiveByIdWithImages(inactiveItem.getId());

		// then
		assertThat(foundItem).isEmpty();
	}

	// 헬퍼 메서드들 - 매개변수를 구체적으로 받도록 개선
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