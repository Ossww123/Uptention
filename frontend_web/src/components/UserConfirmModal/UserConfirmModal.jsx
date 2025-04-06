// src/components/UserConfirmModal/UserConfirmModal.jsx
import React from 'react';
import './UserConfirmModal.css';

const UserConfirmModal = ({ isOpen, userData, onConfirm, onCancel }) => {
  if (!isOpen) return null;

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
            <div className="user-info-item">
              <span className="info-label">비밀번호</span>
              <span className="info-value">{userData.password}</span>
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