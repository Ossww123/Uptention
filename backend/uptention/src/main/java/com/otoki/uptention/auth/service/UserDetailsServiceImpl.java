package com.otoki.uptention.auth.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.otoki.uptention.auth.dto.CustomUserDetails;
import com.otoki.uptention.auth.dto.UserDetailsDto;
import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.repository.UserRepository;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		User user = userRepository.findByUsername(username)
			.orElseThrow(() -> new UsernameNotFoundException(ErrorCode.AUTH_FAILED_LOGIN.getDefaultMessage()));

		// 논리 삭제 여부 판단
		if (!user.getStatus()) {
			throw new UsernameNotFoundException(ErrorCode.AUTH_FAILED_LOGIN.getDefaultMessage());
		}

		UserDetailsDto userDetailsDTO = UserDetailsDto.builder()
			.userId(user.getId())
			.username(user.getUsername())
			.password(user.getPassword())
			.role(user.getRole())
			.build();

		return new CustomUserDetails(userDetailsDTO);
	}
}
