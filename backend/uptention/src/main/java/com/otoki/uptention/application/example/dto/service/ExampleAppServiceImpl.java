package com.otoki.uptention.application.example.dto.service;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.example.service.ExampleService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExampleAppServiceImpl implements ExampleAppService {
	private final ExampleService exampleService;
}
