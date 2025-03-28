package com.otoki.uptention.user;

import static org.assertj.core.api.AssertionsForClassTypes.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.application.user.service.UserAppServiceImpl;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
public class UserAppServiceTest {

	@Mock
	private UserService userService;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private UserAppServiceImpl userAppService;

	@Test
	@DisplayName("joinUser: 정상 케이스 - 비밀번호 암호화 후 사용자 등록")
	void joinUser_whenValid_callsJoin() {
		// given
		// AllArgsConstructor를 이용해 JoinRequestDto를 생성합니다.
		JoinRequestDto joinRequestDto = new JoinRequestDto("testuser", "password123", "Test User", "EMP001");

		when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

		// when
		userAppService.joinUser(joinRequestDto);

		// then: userService.join()이 호출되어 User 객체가 전달되어야 함
		verify(userService).join(any(User.class));
	}

	@Test
	@DisplayName("checkDuplicateUsername: 중복된 아이디가 있으면 예외 발생")
	void checkDuplicateUsername_whenDuplicate_throwsException() {
		// given: userService.validateDuplicateUsername 내부에서 예외 발생
		doThrow(new CustomException(ErrorCode.AUTH_DUPLICATE_USERNAME)).when(userService)
			.validateDuplicateUsername("testuser");

		// when & then
		assertThatThrownBy(() -> userAppService.checkDuplicateUsername("testuser"))
			.isInstanceOf(CustomException.class);
	}

	@Test
	@DisplayName("checkDuplicateEmployeeNumber: 중복된 사번이 있으면 예외 발생")
	void checkDuplicateEmployeeNumber_whenDuplicate_throwsException() {
		// given: userService.validateDuplicateEmployeeNumber 내부에서 예외 발생
		doThrow(new CustomException(ErrorCode.AUTH_DUPLICATE_EMPLOYEE_NUMBER)).when(userService)
			.validateDuplicateEmployeeNumber("EMP001");

		// when & then
		assertThatThrownBy(() -> userAppService.checkDuplicateEmployeeNumber("EMP001"))
			.isInstanceOf(CustomException.class);
	}
}