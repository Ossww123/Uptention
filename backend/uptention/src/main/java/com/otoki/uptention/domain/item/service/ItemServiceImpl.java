package com.otoki.uptention.domain.item.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.otoki.uptention.domain.item.entity.Item;
import com.otoki.uptention.domain.item.repository.ItemRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

	private final ItemRepository itemRepository;

	@Override
	public Optional<Item> getItemDetails(Integer itemId) {
		return itemRepository.findActiveByIdWithImages(itemId);
	}
}
