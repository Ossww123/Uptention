package com.otoki.uptention.application.user.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.otoki.uptention.application.user.dto.request.JoinRequestDto;
import com.otoki.uptention.application.user.dto.request.UpdatePasswordRequestDto;
import com.otoki.uptention.application.user.dto.response.PointResponseDto;
import com.otoki.uptention.application.user.dto.response.ProfileImageResponseDto;
import com.otoki.uptention.application.user.dto.response.UserCursorResponseDto;
import com.otoki.uptention.application.user.dto.response.UserResponseDto;
import com.otoki.uptention.auth.service.SecurityService;
import com.otoki.uptention.auth.service.TokenService;
import com.otoki.uptention.domain.company.entity.Company;
import com.otoki.uptention.domain.user.dto.UserCursorDto;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.enums.UserRole;
import com.otoki.uptention.domain.user.enums.UserSortType;
import com.otoki.uptention.domain.user.service.UserService;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;
import com.otoki.uptention.global.service.ImageUploadService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAppServiceImpl implements UserAppService {
	private static final String PROFILE_DEFAULT_IMAGE = "profile-default.jpg";
	private final UserService userService;
	private final SecurityService securityService;
	private final ImageUploadService imageUploadService;
	private final PasswordEncoder passwordEncoder;
	private	final TokenService tokenService;

	// 일반 멤버 회원가입
	@Override
	@Transactional
	public void joinMember(JoinRequestDto requestDto) {
		User admin = securityService.getLoggedInUser(); // 관리자 정보 조회

		// DTO를 도메인 객체(User)로 변환합니다.
		User user = User.builder()
			.username(requestDto.getUsername())
			.password(passwordEncoder.encode(requestDto.getPassword()))
			.profileImage(PROFILE_DEFAULT_IMAGE)
			.name(requestDto.getName())
			.employeeNumber(requestDto.getEmployeeNumber())
			.company(admin.getCompany()) // 관리자와 같은 회사로 연결
			.role(UserRole.ROLE_TEMP_MEMBER) // 지갑 연결 안된 사용자
			.build();

		userService.join(user);
	}

	// 회원가입 신청 전 username 중복검사
	@Override
	public void checkDuplicateUsername(String username) {
		userService.validateDuplicateUsername(username);
	}

	// 회원가입 신청 전 사번 중복검사
	@Override
	public void checkDuplicateEmployeeNumber(String employeeNumber) {
		userService.validateDuplicateEmployeeNumber(employeeNumber);
	}

	// 프로필 이미지 업로드/업데이트
	@Override
	@Transactional
	public ProfileImageResponseDto updateProfileImage(Integer userId, MultipartFile profileImage) {
		User user = securityService.getLoggedInUser();

		// 로그인 한 유저와 인자로 받은 유저가 일치하지 않으면, 권한 부족 예외 발생
		if (!user.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		String key = imageUploadService.uploadImage(profileImage);
		user.setProfileImage(key);

		return ProfileImageResponseDto.builder()
			.profileImage(imageUploadService.getImageUrl(key))
			.build();
	}

	// 프로필 이미지 기본 이미지로 변경
	@Override
	@Transactional
	public ProfileImageResponseDto removeProfileImage(Integer userId) {
		User user = securityService.getLoggedInUser();

		// 로그인 한 유저와 인자로 받은 유저가 일치하지 않으면, 권한 부족 예외 발생
		if (!user.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		// 이미 기본 이미지라면, 파일 삭제 X
		if (!user.getProfileImage().equals(PROFILE_DEFAULT_IMAGE)) {
			imageUploadService.removeImage(user.getProfileImage());
		}
		user.setProfileImage(PROFILE_DEFAULT_IMAGE);

		return ProfileImageResponseDto.builder()
			.profileImage(imageUploadService.getImageUrl(PROFILE_DEFAULT_IMAGE))
			.build();
	}

	// 포인트 조회
	@Override
	public PointResponseDto getUserPoints(Integer userId) {

		User loggedInUser = securityService.getLoggedInUser();

		if (!loggedInUser.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		return PointResponseDto.builder()
			.point(userService.getUserById(userId).getPoint())
			.build();
	}

	@Override
	public UserResponseDto getUser(Integer userId) {
		User user = userService.getUserByIdAndCompany(userId,
			securityService.getLoggedInUser().getCompany()); // 로그인 한 유저와 같은 회사의 회원만 조회 가능함.

		return mapToDto(user);
	}

	@Override
	public UserCursorResponseDto getUsers(UserRole userRole, String keyword, String cursorStr, UserSortType sortType,
		int size) {

		User loggedInUser = securityService.getLoggedInUser(); // 로그인한 사용자와 소속 Company 추출
		Company company = loggedInUser.getCompany();

		// 커서 디코딩
		UserCursorDto<String> cursor = UserCursorDto.decode(cursorStr, String.class);

		// size + 1개 조회하여 다음 페이지 존재 여부 확인
		List<User> users = userService.getUsersByCursor(company, userRole, keyword, cursor, sortType, size + 1);
		boolean hasNextPage = users.size() > size;
		List<User> resultUsers = hasNextPage ? users.subList(0, size) : users;

		// Entity를 DTO로 매핑
		List<UserResponseDto> userResponseDtos = resultUsers.stream()
			.map(this::mapToDto)
			.collect(Collectors.toList());

		// 다음 커서 생성 (마지막 User 기준)
		String nextCursor = (hasNextPage && !resultUsers.isEmpty())
			? createNextCursor(resultUsers.get(resultUsers.size() - 1), sortType)
			: null;

		return UserCursorResponseDto.builder()
			.users(userResponseDtos)
			.hasNextPage(hasNextPage)
			.nextCursor(nextCursor)
			.build();
	}

	// 회원 삭제 메서드
	@Override
	@Transactional
	public void removeUser(Integer userId) {
		User loggedInUser = securityService.getLoggedInUser();

		// 요청한 자신도 아니고, 관리자도 아니라면 예외 발생
		if (!loggedInUser.getId().equals(userId) && !loggedInUser.getRole().equals(UserRole.ROLE_ADMIN)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		User user = userService.getUserById(userId);
		user.setStatus(false);
	}

	// 비밀번호 변경 메서드
	@Override
	@Transactional
	public void updatePassword(Integer userId, UpdatePasswordRequestDto updatePasswordRequestDto) {
		User loggedInUser = securityService.getLoggedInUser();

		if (!loggedInUser.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		if (!passwordEncoder.matches(updatePasswordRequestDto.getCurrentPassword(), loggedInUser.getPassword())) {
			throw new CustomException(ErrorCode.AUTH_BAD_REQUEST_PASSWORD);
		}
		loggedInUser.setPassword(passwordEncoder.encode(updatePasswordRequestDto.getNewPassword()));
	}

	@Override
	@Transactional
	public void connectWallet(HttpServletResponse response, Integer userId, String wallet) {
		User loggedInUser = securityService.getLoggedInUser();

		// 권한 확인
		if (!loggedInUser.getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN_USER);
		}

		loggedInUser.setRole(UserRole.ROLE_MEMBER);

		// 지갑 연동
		loggedInUser.setWallet(wallet);

		// accessToken 재발급
		tokenService.issueToken(response, userId, loggedInUser.getRole().name());
	}

	private UserResponseDto mapToDto(User user) {
		return UserResponseDto.builder()
			.userId(user.getId())
			.username(user.getUsername())
			.name(user.getName())
			.employeeNumber(user.getEmployeeNumber())
			.wallet(user.getWallet())
			.profileImage(imageUploadService.getImageUrl(user.getProfileImage()))
			.role(user.getRole().toString())
			.createdAt(user.getCreatedAt())
			.build();
	}

	private String createNextCursor(User lastUser, UserSortType sortType) {
		String value;
		if (sortType == UserSortType.NAMES_ASC) {
			value = lastUser.getName();
		} else if (sortType == UserSortType.REGISTER_DATE_ASC || sortType == UserSortType.REGISTER_DATE_DESC) {
			// LocalDateTime을 문자열로 변환 (포맷에 따라 변경 가능)
			value = lastUser.getCreatedAt().toString();
		} else {
			throw new CustomException(ErrorCode.USER_INVALID_SORT_TYPE);
		}
		return new UserCursorDto<>(value, lastUser.getId()).encode();
	}

}
