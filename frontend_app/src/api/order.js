import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// 주문 목록 조회
export const getOrders = async (authToken, cursor, size, type) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/orders`, {
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
    console.error("주문 목록 조회 오류:", error);
    throw error;
  }
};

// 주문 상세 정보 조회
export const getOrderDetail = async (authToken, orderId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/orders/${orderId}`,
      {
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
    console.error('주문 상세 정보 조회 오류:', error);
    return { data: null, ok: false, error };
  }
};

// 주문 상태 업데이트
export const updateOrderStatus = async (authToken, orderId, status) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/api/orders/${orderId}/status`,
      { status },
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
    console.error('주문 상태 업데이트 오류:', error);
    return { data: null, ok: false, error };
  }
};

// 최근 배송지 조회
export const getRecentDeliveryInfo = async (authToken) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/orders/delivery-info`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && 
        response.data.address && 
        typeof response.data.address === 'string' && 
        response.data.address.trim() !== '') {
      const addressParts = response.data.address.split(' ');
      const zonecode = addressParts[0].replace('[', '').replace(']', '');
      const roadAddress = addressParts.slice(1, -1).join(' ');
      const detailAddress = addressParts[addressParts.length - 1];

      return {
        data: {
          zonecode,
          roadAddress,
          detailAddress,
          buildingName: ''
        },
        ok: true
      };
    }
    return { data: null, ok: true };
  } catch (error) {
    console.error('최근 배송지 조회 실패:', error);
    return { data: null, ok: false, error };
  }
};

// 주문 검증
export const verifyOrder = async (authToken, orderItems) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/orders/verify`,
      { orderItems },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { data: response.data, ok: true };
  } catch (error) {
    console.error('주문 검증 오류:', error);
    return { data: null, ok: false, error };
  }
};

// 주문 생성
export const createOrder = async (authToken, orderData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { data: response.data, ok: true };
  } catch (error) {
    console.error('주문 생성 오류:', error);
    return { data: null, ok: false, error };
  }
};

