import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// 집중 모드 시작
export const startFocusMode = async (authToken, latitude, longitude) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/mining-time/focus`,
      {
        latitude,
        longitude,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("집중 모드 시작 API 호출 실패:", error);
    throw error;
  }
};

// 집중 모드 종료
export const endFocusMode = async (authToken, totalTime) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/api/mining-time/focus`,
      {
        totalTime
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("집중 모드 종료 API 호출 실패:", error);
    throw error;
  }
}; 