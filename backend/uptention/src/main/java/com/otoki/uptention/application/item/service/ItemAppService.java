package com.otoki.uptention.application.item.service;

import com.otoki.uptention.application.item.dto.response.ItemResponseDto;

public interface ItemAppService {

	ItemResponseDto getItemDetails(Integer itemId);

}
