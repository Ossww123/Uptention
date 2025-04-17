import axios from 'axios';
import { API_BASE_URL } from '../config/config';

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

// 배송지 등록
export const registerDeliveryInfo = async (authToken, orderId, address) => {
  try {
    await axios.post(
      `${API_BASE_URL}/api/orders/${orderId}/delivery-info`,
      { address },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return { ok: true };
  } catch (error) {
    console.error('배송지 등록 오류:', error);
    return { ok: false, error };
  }
}; 