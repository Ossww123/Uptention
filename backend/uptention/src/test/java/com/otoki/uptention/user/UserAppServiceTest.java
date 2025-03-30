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
import com.otoki.uptention.application.user.dto.request.UpdatePasswordRequestDto;
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

	@Test
	@DisplayName("removeUser: 정상 케이스 - 로그인 사용자가 자신의 계정을 삭제하는 경우")
	void removeUser_whenSelfDeletion_thenSuccess() {
		// given
		int userId = 1;
		User loggedInUser = User.builder()
			.id(userId)
			.role(UserRole.ROLE_MEMBER)
			.build();
		when(securityService.getLoggedInUser()).thenReturn(loggedInUser);

		User userToRemove = User.builder()
			.id(userId)
			.status(true) // 초기 상태가 true라고 가정
			.build();
		when(userService.getUserById(userId)).thenReturn(userToRemove);

		// when
		userAppService.removeUser(userId);

		// then: 해당 사용자의 상태가 false로 변경되었음을 검증
		assertThat(userToRemove.getStatus()).isFalse();
		verify(userService).getUserById(userId);
	}

	@Test
	@DisplayName("removeUser: 정상 케이스 - 관리자가 다른 사용자를 삭제하는 경우")
	void removeUser_whenAdminDeletesAnotherUser_thenSuccess() {
		// given
		int targetUserId = 2;
		// 관리자는 자신의 id가 targetUserId와 다르더라도 관리자 권한으로 삭제 가능
		User adminUser = User.builder()
			.id(1)
			.role(UserRole.ROLE_ADMIN)
			.build();
		when(securityService.getLoggedInUser()).thenReturn(adminUser);

		User userToRemove = User.builder()
			.id(targetUserId)
			.status(true)
			.build();
		when(userService.getUserById(targetUserId)).thenReturn(userToRemove);

		// when
		userAppService.removeUser(targetUserId);

		// then
		assertThat(userToRemove.getStatus()).isFalse();
		verify(userService).getUserById(targetUserId);
	}

	@Test
	@DisplayName("removeUser: 권한 부족 - 로그인 사용자가 다른 사용자를 삭제하려 할 경우")
	void removeUser_whenNonAdminDeletesAnotherUser_thenThrowsException() {
		// given
		int targetUserId = 2;
		// 로그인 사용자가 관리자도 아니고, 삭제 대상도 본인이 아님
		User nonAdminUser = User.builder()
			.id(1)
			.role(UserRole.ROLE_MEMBER)
			.build();
		when(securityService.getLoggedInUser()).thenReturn(nonAdminUser);

		// when & then: 예외 발생을 검증
		CustomException exception = assertThrows(CustomException.class, () -> userAppService.removeUser(targetUserId));
		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN_USER);
		// userService.getUserById는 호출되지 않아야 함
		verify(userService, never()).getUserById(anyInt());
	}

	@Test
	@DisplayName("updatePassword: 정상 케이스 - 현재 비밀번호가 일치하면 비밀번호 업데이트 성공")
	void updatePassword_whenCurrentPasswordMatches_thenUpdatesPassword() {
		// given
		UpdatePasswordRequestDto dto = new UpdatePasswordRequestDto("currentPass", "newPass");

		User loggedInUser = User.builder()
			.id(1)
			.password("encodedCurrentPass")
			.build();
		when(securityService.getLoggedInUser()).thenReturn(loggedInUser);
		when(passwordEncoder.matches("currentPass", "encodedCurrentPass")).thenReturn(true);
		when(passwordEncoder.encode("newPass")).thenReturn("encodedNewPass");

		// when
		userAppService.updatePassword(dto);

		// then: 비밀번호가 새 값으로 업데이트 되었는지 검증
		assertThat(loggedInUser.getPassword()).isEqualTo("encodedNewPass");
	}

	@Test
	@DisplayName("updatePassword: 비정상 케이스 - 현재 비밀번호 불일치로 인한 예외 발생")
	void updatePassword_whenCurrentPasswordDoesNotMatch_thenThrowException() {
		// given
		UpdatePasswordRequestDto dto = new UpdatePasswordRequestDto("currentPass", "newPass");

		User loggedInUser = User.builder()
			.id(1)
			.password("encodedCurrentPass")
			.build();
		when(securityService.getLoggedInUser()).thenReturn(loggedInUser);
		when(passwordEncoder.matches("currentPass", "encodedCurrentPass")).thenReturn(false);

		// when & then: 현재 비밀번호 불일치 시 CustomException 발생
		CustomException exception = assertThrows(CustomException.class, () -> {
			userAppService.updatePassword(dto);
		});
		assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.AUTH_BAD_REQUEST_PASSWORD);
	}
}