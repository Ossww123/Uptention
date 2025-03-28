package com.otoki.uptention.user;

import static org.assertj.core.api.AssertionsForClassTypes.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.repository.UserRepository;
import com.otoki.uptention.domain.user.service.UserServiceImpl;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private UserServiceImpl userServiceImpl;

	@Test
	@DisplayName("회원가입 시 중복 체크를 통과하면 사용자 저장")
	void join_validUser_savesUser() {
		// given
		User user = User.builder()
			.username("testuser")
			.password("encodedPassword")
			.name("Test User")
			.employeeNumber("EMP001")
			.build();

		when(userRepository.existsByUsername("testuser")).thenReturn(false);
		when(userRepository.existsByEmployeeNumber("EMP001")).thenReturn(false);
		when(userRepository.save(user)).thenReturn(user);

		// when
		userServiceImpl.join(user);

		// then
		verify(userRepository, times(1)).save(user);
	}

	@Test
	@DisplayName("회원가입 시 중복된 아이디가 있으면 예외 발생")
	void join_duplicateUsername_throwsException() {
		// given
		User user = User.builder()
			.username("testuser")
			.password("encodedPassword")
			.name("Test User")
			.employeeNumber("EMP001")
			.build();

		when(userRepository.existsByUsername("testuser")).thenReturn(true);

		// when, then
		assertThatThrownBy(() -> userServiceImpl.join(user))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.AUTH_DUPLICATE_USERNAME);
	}

	@Test
	@DisplayName("회원가입 시 중복된 사번이 있으면 예외 발생")
	void join_duplicateEmployeeNumber_throwsException() {
		// given
		User user = User.builder()
			.username("testuser")
			.password("encodedPassword")
			.name("Test User")
			.employeeNumber("EMP001")
			.build();

		when(userRepository.existsByUsername("testuser")).thenReturn(false);
		when(userRepository.existsByEmployeeNumber("EMP001")).thenReturn(true);

		// when, then
		assertThatThrownBy(() -> userServiceImpl.join(user))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.AUTH_DUPLICATE_EMPLOYEE_NUMBER);
	}

	@Test
	@DisplayName("getUserById: 존재하는 사용자 반환")
	void getUserById_whenUserExists_returnsUser() {
		// given
		User user = User.builder()
			.username("testuser")
			.employeeNumber("EMP001")
			.build();
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		// when
		User result = userServiceImpl.getUserById(1);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	@Test
	@DisplayName("getUserById: 존재하지 않는 사용자면 예외 발생")
	void getUserById_whenUserNotExists_throwsException() {
		// given
		when(userRepository.findById(1)).thenReturn(Optional.empty());

		// when, then
		assertThatThrownBy(() -> userServiceImpl.getUserById(1))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
	}

	@Test
	@DisplayName("validateDuplicateUsername: 중복이 없으면 예외 없이 실행")
	void validateDuplicateUsername_whenNotDuplicate() {
		// given
		when(userRepository.existsByUsername("testuser")).thenReturn(false);

		// when & then: 예외 없이 실행됨
		userServiceImpl.validateDuplicateUsername("testuser");
	}

	@Test
	@DisplayName("validateDuplicateEmployeeNumber: 중복이 없으면 예외 없이 실행")
	void validateDuplicateEmployeeNumber_whenNotDuplicate() {
		// given
		when(userRepository.existsByEmployeeNumber("EMP001")).thenReturn(false);

		// when & then: 예외 없이 실행됨
		userServiceImpl.validateDuplicateEmployeeNumber("EMP001");
	}
}