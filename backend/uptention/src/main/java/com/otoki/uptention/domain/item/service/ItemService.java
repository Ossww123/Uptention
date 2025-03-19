package com.otoki.uptention.domain.item.service;

import java.util.Optional;

import com.otoki.uptention.domain.item.entity.Item;

public interface ItemService {
	Optional<Item> getItemDetails(Integer itemId);
}
