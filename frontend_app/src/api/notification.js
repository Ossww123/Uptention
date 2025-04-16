import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// 읽지 않은 알림 개수 조회
export const getUnreadNotificationCount = async (authToken) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/notifications/count`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: { read: false },
      }
    );
    return response.data;
  } catch (error) {
    console.error("알림 개수 조회 오류:", error);
    throw error;
  }
}; 