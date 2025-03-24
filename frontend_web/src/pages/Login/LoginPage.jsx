// src/pages/Login/LoginPage.jsx
import React, { useState } from 'react';
import './LoginPage.css';
import logoImage from '../../assets/images/logo.png'; // 로고 이미지 경로 지정 필요

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 여기에 나중에 API 요청 로직 추가
    // 임시로 콘솔에 출력
    console.log('로그인 시도:', credentials);
    
    // 임시 검증 로직 (나중에 제거)
    if (!credentials.username || !credentials.password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    // 성공 시 리다이렉트 예시 (실제 구현 시에는 인증 후 처리)
    // history.push('/dashboard');
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
            />
          </div>
          
          <button type="submit" className="login-button">
            로그인
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;