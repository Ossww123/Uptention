import axios from 'axios';
import { API_BASE_URL } from '../config/config';

// 사용자 정보 조회
export const getUserInfo = async (userId, authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
    throw error;
  }
};

// 프로필 이미지 업로드
export const uploadProfileImage = async (userId, authToken, formData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/${userId}/profiles`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    throw error;
  }
};

// 프로필 이미지 삭제
export const deleteProfileImage = async (userId, authToken) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/users/${userId}/profiles`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("이미지 삭제 오류:", error);
    throw error;
  }
};

// 비밀번호 변경
export const changePassword = async (userId, authToken, currentPassword, newPassword) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/api/users/${userId}/password`,
      {
        currentPassword,
        newPassword
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    throw error;
  }
}; 