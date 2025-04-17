import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// 채굴 시간 랭킹 조회
export const getMiningTimeRanking = async (authToken, top) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/mining-time`, {
      params: {
        top
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("랭킹 데이터 조회 실패:", error);
    throw error;
  }
}; 