package com.otoki.uptention.item;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.otoki.uptention.AppServiceTestSupport;
import com.otoki.uptention.application.item.dto.response.ItemResponseDto;
import com.otoki.uptention.application.item.service.ItemAppService;
import com.otoki.uptention.domain.category.entity.Category;
import com.otoki.uptention.domain.category.repository.CategoryRepository;
import com.otoki.uptention.domain.image.entity.Image;
import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.service.ItemService;

class ItemAppServiceTest extends AppServiceTestSupport {

	@Autowired
	private ItemAppService itemAppService;

	@MockBean
	private ItemService itemService;

	@MockBean
	private CategoryRepository categoryRepository;

	@Test
	@DisplayName("아이템 ID로 아이템 상세 정보를 조회할 수 있다")
	void getItemDetails_WithValidId_ReturnsItemResponseDto() {
		// given
		Integer itemId = 1;
		Item item = createItem(itemId);
		List<Image> images = createImages(item, 2);

		when(itemService.getItemById(itemId)).thenReturn(item);

		// when
		ItemResponseDto response = itemAppService.getItemDetails(itemId);

		// then
		assertThat(response).isNotNull();
		assertThat(response.getItemId()).isEqualTo(itemId);
		assertThat(response.getName()).isEqualTo("테스트 상품");
		assertThat(response.getDetail()).isEqualTo("상품 설명");
		assertThat(response.getPrice()).isEqualTo(10000);
		assertThat(response.getBrand()).isEqualTo("테스트 브랜드");
		assertThat(response.getCategoryId()).isEqualTo(1);
		assertThat(response.getCategoryName()).isEqualTo("테스트 카테고리");
		assertThat(response.getQuantity()).isEqualTo(50);
		assertThat(response.getImages()).hasSize(2);
		assertThat(response.getImages()).containsExactly(
			"http://example.com/image1.jpg",
			"http://example.com/image2.jpg"
		);
	}

	// 헬퍼 메서드들 (변경 없음)
	private Category createCategory() {
		return Category.builder()
			.id(1)
			.name("테스트 카테고리")
			.build();
	}

	private Item createItem(Integer itemId) {
		LocalDateTime now = LocalDateTime.now();

		Item item = Item.builder()
			.id(itemId)
			.name("테스트 상품")
			.detail("상품 설명")
			.price(10000)
			.brand("테스트 브랜드")
			.status(true)
			.category(createCategory())
			.quantity(50)
			.salesCount(5)
			.images(new ArrayList<>())
			.build();

		return item;
	}

	private List<Image> createImages(Item item, int count) {
		List<Image> images = new ArrayList<>();
		for (int i = 0; i < count; i++) {
			Image image = Image.builder()
				.id(i + 1)
				.url("http://example.com/image" + (i + 1) + ".jpg")
				.item(item)
				.build();
			images.add(image);
			item.getImages().add(image);  // 아이템의 이미지 목록에도 추가
		}
		return images;
	}
}