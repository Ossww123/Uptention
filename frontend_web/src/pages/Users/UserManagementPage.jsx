// src/pages/Users/UserManagementPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagementPage.css';
import axios from 'axios'; // axios 사용, 필요시 설치: npm install axios

const UserManagementPage = () => {
  // 상태 관리
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  
  // Refs
  const observer = useRef();
  const navigate = useNavigate();

  // API에서 사용자 데이터 가져오기 (useCallback으로 감싸기)
  const fetchUsers = useCallback(async (isSearch = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/users', {
        params: {
          keyword: searchTerm,
          cursor: isSearch ? null : nextCursor,
          size: 10
        }
      });
      
      const data = response.data;
      
      // 응답 형식에 따라 조정 (API 응답에는 hasMore 정보와 nextCursor가 포함되어 있어야 함)
      if (isSearch) {
        setUsers(data.users || []);
      } else {
        setUsers(prev => [...prev, ...(data.users || [])]);
      }
      
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError('사용자 정보를 불러오는 데 실패했습니다.');
      console.error('API 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, nextCursor]); // 종속성에 searchTerm과 nextCursor 추가

  // 무한 스크롤을 위한 추가 데이터 로드 (useCallback으로 감싸기)
  const fetchMoreUsers = useCallback(() => {
    if (!loading && hasMore) {
      fetchUsers();
    }
  }, [loading, hasMore, fetchUsers]); // fetchUsers도 종속성에 추가

  // 마지막 요소 ref callback (종속성 배열 업데이트)
  const lastUserElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreUsers();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchMoreUsers]); // fetchMoreUsers 추가

  // 초기 사용자 데이터 로드 (종속성 배열 업데이트)
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // fetchUsers 추가

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색 기능
  const handleSearch = (e) => {
    e.preventDefault();
    setUsers([]);
    setNextCursor(null);
    setHasMore(true);
    fetchUsers(true);
  };

  // 사용자 삭제 핸들러
  const handleDeleteUser = async (userId) => {
    if (window.confirm('정말로 이 회원을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        
        // UI에서 사용자 제거
        setUsers(users.filter(user => user.employeeNumber !== userId));
        
        // 성공 메시지 표시
        alert('회원이 성공적으로 삭제되었습니다.');
      } catch (err) {
        alert('회원 삭제에 실패했습니다.');
        console.error('회원 삭제 오류:', err);
      }
    }
  };

  // 사용자 추가 버튼 핸들러
  const handleAddUser = () => {
    navigate('/admin/users/create');
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}`;
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
          {error && <div className="error-message">{error}</div>}
          
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
              {users.map((user, index) => (
                <tr 
                  key={user.employeeNumber} 
                  ref={index === users.length - 1 ? lastUserElementRef : null}
                >
                  <td>{user.employeeNumber}</td>
                  <td>{user.userId}</td>
                  <td>{user.username}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteUser(user.employeeNumber)}
                    >
                      삭제하기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>데이터를 불러오는 중...</p>
            </div>
          )}
          
          {!loading && users.length === 0 && (
            <div className="no-users-message">
              <p>등록된 회원이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="action-buttons">
        <button className="add-button" onClick={handleAddUser}>추가</button>
      </div>
    </div>
  );
};

export default UserManagementPage;