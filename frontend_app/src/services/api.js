// src/services/api.js - 수정 버전
import { getToken } from './AuthService';
import FCMUtils from '../utils/FCMUtils';

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
    
    // 로그인이나 로그아웃 요청에 FCM 토큰 추가
    if (endpoint === '/login' || endpoint === '/logout') {
      const fcmToken = await FCMUtils.getFCMToken();
      if (fcmToken) {
        headers['FCM-Token'] = fcmToken;
        
        // 로그인/로그아웃 요청의 헤더를 콘솔에 출력
        console.log(`=== ${endpoint} 요청 헤더 ===`);
        console.log('Authorization:', headers['Authorization'] || '없음');
        console.log('FCM-Token:', headers['FCM-Token']);
        console.log('Content-Type:', headers['Content-Type']);
        console.log('기타 헤더:', JSON.stringify(headers));
      }
    }
    
    const config = {
      ...options,
      headers,
    };

    // 요청 상세 정보 로깅 (로그인/로그아웃인 경우)
    if (endpoint === '/login' || endpoint === '/logout') {
      console.log(`요청 URL: ${url}`);
      console.log(`요청 메서드: ${options.method || 'GET'}`);
      
      // 보안을 위해 비밀번호는 로그에서 가림
      if (endpoint === '/login' && options.body) {
        const bodyObj = JSON.parse(options.body);
        console.log('요청 데이터:', {
          ...bodyObj,
          password: bodyObj.password ? '********' : undefined
        });
      } else if (options.body) {
        console.log('요청 데이터:', options.body);
      }
    }
    
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