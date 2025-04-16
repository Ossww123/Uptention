import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// 선물 목록 조회
export const getGifts = async (authToken, cursor, size, type) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/gifts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        cursor,
        size,
        type
      }
    });
    return response.data;
  } catch (error) {
    console.error("선물 목록 조회 오류:", error);
    throw error;
  }
};

// 사용자 목록 조회
export const getUsers = async (authToken, params) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/users`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 200) {
      return {
        data: response.data,
        ok: true
      };
    }
    return { data: null, ok: false };
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return { data: null, ok: false, error };
  }
};

// 선물하기 주문 생성
export const createGiftOrder = async (authToken, giftData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/orders/gift`,
      giftData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      data: response.data,
      ok: true
    };
  } catch (error) {
    console.error('선물하기 주문 생성 오류:', error);
    return { data: null, ok: false, error };
  }
}; 