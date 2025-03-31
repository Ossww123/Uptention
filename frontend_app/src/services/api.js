import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://j12d211.p.ssafy.io/api';
const TOKEN_KEY = 'auth_token';

// 토큰 가져오기
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// 토큰 저장하기
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
};

// 토큰 삭제하기 (로그아웃)
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

// API 요청 함수
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getToken();
    const url = `${BASE_URL}${endpoint}`;
    
    // 기본 헤더
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // 토큰이 있으면 Authorization 헤더 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      ...options,
      headers,
    };
    
    const response = await fetch(url, config);
    
    // 401 Unauthorized 상태 처리 (토큰 만료 또는 유효하지 않음)
    if (response.status === 401) {
      // 토큰 삭제하고 로그인 화면으로 리다이렉트 로직 추가 가능
      // 여기서는 에러만 발생시킵니다
      throw new Error('Unauthorized: Token may be invalid or expired');
    }
    
    // JSON 응답이 아닌 경우를 위한 처리
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, status: response.status, ok: response.ok };
    } else {
      return { status: response.status, ok: response.ok };
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// 편의를 위한 HTTP 메서드별 함수
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

export const post = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, { 
    ...options, 
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const put = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, { 
    ...options, 
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const patch = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, { 
    ...options, 
    method: 'PATCH',
    body: JSON.stringify(data)
  });
};

export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};