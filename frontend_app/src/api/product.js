import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { get, post } from '../services/api';

// 상품 상세 정보 조회
export const getProductDetail = async (productId) => {
  try {
    const { data, ok } = await get(`/items/${productId}`);
    if (!ok) {
      throw new Error(data.message || "상품 정보를 불러오지 못했습니다.");
    }
    return { data, ok };
  } catch (error) {
    console.error("상품 상세 정보 조회 실패:", error);
    throw error;
  }
};

// 장바구니에 상품 추가
export const addToCart = async (productId, quantity = 1) => {
  try {
    const { data, ok } = await post("/shopping-cart", {
      itemId: productId,
      quantity: quantity,
    });
    if (!ok) {
      throw new Error(data.message || "장바구니 추가에 실패했습니다.");
    }
    return { data, ok };
  } catch (error) {
    console.error("장바구니 추가 실패:", error);
    throw error;
  }
};

// 장바구니 개수 조회
export const getCartItemCount = async () => {
  try {
    const { data, ok } = await get("/shopping-cart/count");
    if (!ok) {
      throw new Error("장바구니 개수 조회에 실패했습니다.");
    }
    return { data, ok };
  } catch (error) {
    console.error("장바구니 개수 조회 실패:", error);
    throw error;
  }
}; 