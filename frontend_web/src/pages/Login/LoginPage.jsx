// src/pages/Login/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';
import logoImage from '../../assets/images/login-image-Photoroom.png'; 

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 이미 로그인되어 있는지 확인
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      navigate('/admin/users');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 기본 유효성 검사
    if (!credentials.username || !credentials.password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // API 요청 (BASE URL 추가 및 loginType 항상 admin으로 설정)
      const response = await axios.post('https://j12d211.p.ssafy.io/api/login', {
        username: credentials.username,
        password: credentials.password,
        loginType: 'admin'
      });
      
      // 성공 응답 처리
      if (response.status === 200) {
        // 응답에서 토큰 추출 (API 명세에 따라 수정 필요할 수 있음)
        const token = response.data.token || response.headers['authorization'];
        
        // 로컬 스토리지에 토큰 저장
        if (token) {
          localStorage.setItem('auth-token', token);
        }
        
        // 관리자 페이지로 리다이렉트
        navigate('/admin/users');
      }
    } catch (err) {
      console.error('로그인 에러:', err);
      
      // 오류 응답 처리
      if (err.response) {
        const { status, data } = err.response;
        
        if (status === 400) {
          setError('잘못된 요청입니다. 입력 정보를 확인해주세요.');
        } else if (status === 401) {
          setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        } else {
          setError(data.message || '로그인 중 오류가 발생했습니다.');
        }
      } else {
        setError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="logo-container">
          <img src={logoImage} alt="UPTENTION 로고" className="logo" />
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="아이디"
              value={credentials.username}
              onChange={handleChange}
              className="login-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="패스워드"
              value={credentials.password}
              onChange={handleChange}
              className="login-input"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;