// src/services/api.js
import { getToken } from './AuthService';

const BASE_URL = 'https://j12d211.p.ssafy.io/api';

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
    
    // JSON 응답이 아닌 경우를 위한 처리
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }
    
    // 헤더 정보도 반환
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    return { 
      data, 
      status: response.status, 
      ok: response.ok,
      headers: responseHeaders
    };
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