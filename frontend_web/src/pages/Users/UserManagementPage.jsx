// src/pages/Users/UserManagementPage.jsx
import React, { useState } from 'react';
import './UserManagementPage.css';

const UserManagementPage = () => {
  // 더미 데이터
  const [users, setUsers] = useState([
    { id: '21100001', userId: 'admin123', name: '대성생', joinDate: '2000. 01. 01' },
    { id: '21100002', userId: 'admin123', name: '생막장', joinDate: '2000. 01. 01' },
    { id: '21100003', userId: 'admin123', name: '대성장', joinDate: '2000. 01. 01' },
    { id: '21100004', userId: 'admin123', name: '대막장', joinDate: '2000. 01. 01' },
    { id: '21100005', userId: 'admin123', name: '성막장', joinDate: '2000. 01. 01' },
  ]);

  // 검색 상태
  const [searchTerm, setSearchTerm] = useState('');

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색 기능
  const handleSearch = (e) => {
    e.preventDefault();
    console.log('검색어:', searchTerm);
    // 실제로는 여기서 API 호출을 통해 검색 결과를 가져옵니다.
  };

  // 사용자 삭제 핸들러
  const handleDeleteUser = (userId) => {
    if (window.confirm('정말로 이 회원을 삭제하시겠습니까?')) {
      // 실제로는 API 호출을 통해 사용자를 삭제합니다.
      console.log('삭제할 사용자 ID:', userId);
      
      // 임시로 UI에서만 제거
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  // 사용자 추가 버튼 핸들러
  const handleAddUser = () => {
    // 사용자 추가 페이지로 이동하거나 모달을 표시합니다.
    console.log('사용자 추가 버튼 클릭');
  };

  return (
    <div className="user-management">
      {/* 상단 검색바 영역 */}
      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="회원 검색"
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button type="submit" className="search-button">검색</button>
        </form>
      </div>
      
      {/* 회원 목록 영역 - 흰색 카드 */}
      <div className="content-card">
        <div className="user-management-header">
          <h1 className="page-title">회원 목록</h1>
          
          <div className="user-stats">
            <div className="stat-box">
              <span className="stat-label">총회원수</span>
              <span className="stat-value">{users.length}명</span>
            </div>
          </div>
        </div>
        
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>사원번호</th>
                <th>회원아이디</th>
                <th>이름</th>
                <th>가입날짜</th>
                <th>회원삭제</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.userId}</td>
                  <td>{user.name}</td>
                  <td>{user.joinDate}</td>
                  <td>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      삭제하기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="action-buttons">
        <button className="add-button" onClick={handleAddUser}>추가</button>
      </div>
    </div>
  );
};

export default UserManagementPage;