package com.otoki.uptention.example;

import static org.assertj.core.api.Assertions.*;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.otoki.uptention.RepositoryTestSupport;
import com.otoki.uptention.domain.example.entity.Example;
import com.otoki.uptention.domain.example.repository.ExampleRepository;

public class ExampleRepositoryTest extends RepositoryTestSupport {

	@Autowired
	private ExampleRepository exampleRepository;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	@DisplayName("Example 엔티티 저장 및 조회 테스트")
	void testSaveAndFindExample() {
		// given
		Example example = Example.builder()
			.name("테스트 이름")
			.description("테스트 설명")
			.active(true)
			.build();

		// when
		Example savedExample = exampleRepository.save(example);

		// then
		assertThat(savedExample.getId()).isNotNull();

		Example foundExample = exampleRepository.findById(savedExample.getId()).orElse(null);
		assertThat(foundExample).isNotNull();
		assertThat(foundExample.getName()).isEqualTo("테스트 이름");
		assertThat(foundExample.getDescription()).isEqualTo("테스트 설명");
		assertThat(foundExample.getActive()).isTrue();
	}

	@Test
	@DisplayName("MySQL 모드 특화 기능 - LIMIT 구문 테스트")
	void testMySQLLimitFeature() {
		// given
		for (int i = 1; i <= 5; i++) {
			Example example = Example.builder()
				.name("이름 " + i)
				.description("설명 " + i)
				.active(true)
				.build();
			exampleRepository.save(example);
		}

		// when
		List<Map<String, Object>> limitResults = jdbcTemplate.queryForList(
			"SELECT * FROM example ORDER BY id LIMIT 3"
		);

		// then
		assertThat(limitResults).hasSize(3);
	}

	@Test
	@DisplayName("MySQL 모드 특화 기능 - 문자열 함수 테스트")
	void testMySQLStringFunctions() {
		// given
		Example example = Example.builder()
			.name("테스트")
			.description("설명")
			.active(true)
			.build();
		exampleRepository.save(example);

		// when
		List<Map<String, Object>> concatResults = jdbcTemplate.queryForList(
			"SELECT id, CONCAT(name, ' - ', description) as full_text FROM example"
		);

		// then
		assertThat(concatResults).isNotEmpty();
		String fullText = (String)concatResults.get(0).get("full_text");
		assertThat(fullText).isEqualTo("테스트 - 설명");
	}

	@Test
	@DisplayName("MySQL 모드 특화 기능 - 테이블 구조 확인")
	void testMySQLTableStructure() {
		// when
		List<Map<String, Object>> tableInfo = jdbcTemplate.queryForList(
			"SHOW COLUMNS FROM example"
		);

		// then
		assertThat(tableInfo).isNotEmpty();

		// 컬럼 존재 여부만 확인
		boolean hasIdColumn = tableInfo.stream()
			.anyMatch(col -> "id".equalsIgnoreCase((String)col.get("FIELD")));
		assertThat(hasIdColumn).isTrue();

		boolean hasNameColumn = tableInfo.stream()
			.anyMatch(col -> "name".equalsIgnoreCase((String)col.get("FIELD")));
		assertThat(hasNameColumn).isTrue();

		boolean hasDescriptionColumn = tableInfo.stream()
			.anyMatch(col -> "description".equalsIgnoreCase((String)col.get("FIELD")));
		assertThat(hasDescriptionColumn).isTrue();

		boolean hasActiveColumn = tableInfo.stream()
			.anyMatch(col -> "active".equalsIgnoreCase((String)col.get("FIELD")));
		assertThat(hasActiveColumn).isTrue();
	}

	@Test
	@DisplayName("MySQL 모드 특화 기능 - BOOLEAN 타입 테스트")
	void testMySQLBooleanType() {
		// given
		Example example = Example.builder()
			.name("테스트")
			.description("설명")
			.active(true)
			.build();
		exampleRepository.save(example);

		// when
		List<Map<String, Object>> results = jdbcTemplate.queryForList(
			"SELECT * FROM example WHERE active = TRUE"
		);

		// then
		assertThat(results).hasSize(1);

		// when
		results = jdbcTemplate.queryForList(
			"SELECT * FROM example WHERE active = FALSE"
		);

		// then
		assertThat(results).isEmpty();
	}
}
