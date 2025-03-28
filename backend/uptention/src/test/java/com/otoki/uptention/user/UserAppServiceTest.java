package com.otoki.uptention.user;

import static org.assertj.core.api.AssertionsForClassTypes.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.application.user.service.UserAppServiceImpl;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
public class UserAppServiceTest {

	@Mock
	private UserService userService;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private SecurityService securityService;

	@InjectMocks
	private UserAppServiceImpl userAppService;

	@Test
	@DisplayName("joinUser: 정상 케이스 - 비밀번호 암호화 후 사용자 등록")
	void joinUser_whenValid_callsJoin() {
		// given
		// AllArgsConstructor를 이용해 JoinRequestDto를 생성합니다.
		JoinRequestDto joinRequestDto = new JoinRequestDto("testuser", "password123", "Test User", "EMP001");
		when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

		// Company 엔티티 생성
		Company company = Company.builder()
			.id(1)
			.name("Test Company")
			.latitude(37.123f)
			.longitude(127.456f)
			.address("서울시 어딘가")
			.build();

		// 관리자 정보에 Company 엔티티를 설정합니다.
		User adminUser = User.builder()
			.username("admin")
			.company(company)
			.build();
		when(securityService.getLoggedInUser()).thenReturn(adminUser);

		// when
		userAppService.joinMember(joinRequestDto);

		// then: 전달된 User 객체의 필드를 검증합니다.
		ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
		verify(userService).join(userCaptor.capture());
		User capturedUser = userCaptor.getValue();

		assertEquals("testuser", capturedUser.getUsername());
		assertEquals("encodedPassword", capturedUser.getPassword());
		assertEquals("Test User", capturedUser.getName());
		assertEquals("EMP001", capturedUser.getEmployeeNumber());
		// 관리자와 같은 회사가 설정되었는지 검증 (동일한 Company 객체)
		assertEquals(company, capturedUser.getCompany());
		// ROLE_TEMP_MEMBER로 설정되었는지 검증
		assertEquals(UserRole.ROLE_TEMP_MEMBER, capturedUser.getRole());
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