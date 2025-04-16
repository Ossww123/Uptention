import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// 사용자 정보 조회
export const getUserInfo = async (userId, authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
    throw error;
  }
};

// 사용자 포인트 조회
export const getUserPoint = async (userId, authToken) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/users/${userId}/point`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("포인트 조회 오류:", error);
    throw error;
  }
};

// 오늘의 집중 시간 조회
export const getDailyFocusTime = async (userId, authToken) => {
  try {
    // 현재 시간을 KST로 변환
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const kstNow = new Date(utc + 9 * 60 * 60 * 1000);

    const year = kstNow.getFullYear();
    const month = String(kstNow.getMonth() + 1).padStart(2, "0");
    const day = String(kstNow.getDate()).padStart(2, "0");

    const startTime = `${year}-${month}-${day}T00:00:00`;
    const endTime = `${year}-${month}-${day}T23:59:59`;

    const response = await axios.get(
      `${API_BASE_URL}/api/users/${userId}/mining-times`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          startTime,
          endTime,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("집중 시간 조회 오류:", error);
    throw error;
  }
}; 