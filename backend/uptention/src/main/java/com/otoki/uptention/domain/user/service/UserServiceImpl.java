package com.otoki.uptention.domain.user.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.user.entity.User;
import com.otoki.uptention.domain.user.repository.UserRepository;
import com.otoki.uptention.global.exception.CustomException;
import com.otoki.uptention.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;

	@Override
	public User getUserById(Integer id) {
		return userRepository.findById(id)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
	}
}
