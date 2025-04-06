// UserConfirmModal.jsx 수정
import React, { useState } from 'react';
import './UserConfirmModal.css';

const UserConfirmModal = ({ isOpen, userData, onConfirm, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  if (!isOpen) return null;

  // 마스킹된 비밀번호를 반환하는 함수
  const maskedPassword = () => {
    if (showPassword) {
      return userData.password;
    }
    return '•'.repeat(userData.password.length);
  };

  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <div className="modal-header">
          <h2>회원 등록 확인</h2>
        </div>
        <div className="modal-body">
          <p className="modal-description">다음 정보로 회원을 등록하시겠습니까?</p>
          
          <div className="user-info-container">
            <div className="user-info-item">
              <span className="info-label">성명</span>
              <span className="info-value">{userData.name}</span>
            </div>
            <div className="user-info-item">
              <span className="info-label">사원번호</span>
              <span className="info-value">{userData.employeeNumber}</span>
            </div>
            <div className="user-info-item">
              <span className="info-label">회원 ID</span>
              <span className="info-value">{userData.username}</span>
            </div>
            <div className="user-info-item password-info-item">
              <span className="info-label">비밀번호</span>
              <div className="password-value-container">
                <span className="info-value">{maskedPassword()}</span>
                <button 
                  type="button" 
                  className="modal-password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel-button" onClick={onCancel}>
            취소
          </button>
          <button className="modal-confirm-button" onClick={onConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConfirmModal;