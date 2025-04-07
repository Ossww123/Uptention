// src/pages/NotFound/NotFoundPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // 이전 페이지로 이동
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">서비스 이용에 불편을 드려 대단히 죄송합니다.</h1>
        <p className="not-found-message">
          요청하신 페이지를 찾을 수 없거나 사용권한이 없습니다.
        </p>
        <p className="not-found-hint">
          입력하신 페이지 주소가 정확한지 다시 한번 확인해보시기 바랍니다.
        </p>
        <button className="return-button" onClick={handleGoBack}>
          돌아가기
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;