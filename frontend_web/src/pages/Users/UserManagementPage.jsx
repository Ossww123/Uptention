// src/pages/Users/UserManagementPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserManagementPage.css";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";

const UserManagementPage = () => {
  // 상태 관리
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [sortOption, setSortOption] = useState("REGISTER_DATE_DESC"); // 기본 정렬: 가입일 내림차순
  const [userRole, setUserRole] = useState(""); // 기본값: 모든 역할
  
  // 모달 관련 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Refs
  const observer = useRef();
  const navigate = useNavigate();

  // API 기본 URL
  const API_BASE_URL = "https://j12d211.p.ssafy.io";

  // API에서 사용자 데이터 가져오기
  const fetchUsers = useCallback(
    async (isSearch = false) => {
      setLoading(true);
      setError(null);

      try {
        // 토큰 가져오기
        const token = localStorage.getItem("auth-token");
        if (!token) {
          throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
        }

        const params = {
          size: 20,
          sort: sortOption,
        };

        // searchTerm이 있을 때만 keyword 파라미터 추가
        if (searchTerm && searchTerm.trim() !== "") {
          params.keyword = searchTerm;
        }

        // userRole이 있을 때만 userRole 파라미터 추가
        if (userRole && userRole.trim() !== "") {
          params.userRole = userRole;
        }

        // nextCursor가 있고 isSearch가 false일 때만 cursor 파라미터 추가
        if (nextCursor && !isSearch) {
          params.cursor = nextCursor;
        }

        console.log("요청 파라미터:", params);
        console.log("요청 토큰:", token);

        const response = await axios.get(`${API_BASE_URL}/api/users`, {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
          params: params,
        });

        const data = response.data;

        if (isSearch) {
          setUsers(data.users || []);
        } else {
          setUsers((prev) => [...prev, ...(data.users || [])]);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.hasNextPage);
      } catch (err) {
        console.error("API 에러:", err);

        if (err.response) {
          console.error("오류 응답 데이터:", err.response.data);
          const { status, data } = err.response;

          if (status === 401) {
            setError("인증이 만료되었습니다. 다시 로그인해주세요.");
            // 로그인 페이지로 리다이렉트
            setTimeout(() => navigate("/login"), 2000);
          } else if (status === 400) {
            setError(data.message || "잘못된 요청입니다.");
          } else if (status === 500) {
            setError(data.message || "서버 오류가 발생했습니다.");
          } else {
            setError("사용자 정보를 불러오는 데 실패했습니다.");
          }
        } else if (err.request) {
          setError("서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.");
        } else {
          setError(err.message || "사용자 정보를 불러오는 데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, nextCursor, sortOption, userRole, navigate]
  );

  // 무한 스크롤을 위한 추가 데이터 로드
  const fetchMoreUsers = useCallback(() => {
    if (!loading && hasMore) {
      fetchUsers();
    }
  }, [loading, hasMore, fetchUsers]);

  // 마지막 요소 ref callback
  const lastUserElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMoreUsers();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchMoreUsers]
  );

  // 초기 사용자 데이터 로드
  useEffect(() => {
    setUsers([]);
    setNextCursor(null);
    setHasMore(true);
    fetchUsers(true);
  }, [fetchUsers, sortOption, userRole]);

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

  // 정렬 옵션 변경 핸들러
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // 역할 필터 변경 핸들러
  const handleRoleChange = (e) => {
    setUserRole(e.target.value);
  };

  // 사용자 삭제 모달 열기
  const openDeleteModal = (userId) => {
    setUserToDelete(userId);
    setModalOpen(true);
  };

  // 사용자 삭제 확인
  const confirmDelete = async () => {
    try {
      // 토큰 가져오기
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }

      await axios.delete(`${API_BASE_URL}/api/users/${userToDelete}`, {
        headers: {
          Authorization: `${token}`,
        },
      });

      // UI에서 사용자 제거
      setUsers(users.filter((user) => user.userId !== userToDelete));

      // 성공 메시지 표시
      alert("회원이 성공적으로 삭제되었습니다.");
      
      // 모달 닫기
      setModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("회원 삭제 오류:", err);

      if (err.response) {
        alert(
          `회원 삭제에 실패했습니다: ${
            err.response.data.message || "알 수 없는 오류"
          }`
        );
      } else {
        alert("회원 삭제에 실패했습니다. 네트워크 연결을 확인해주세요.");
      }
      
      // 모달 닫기
      setModalOpen(false);
      setUserToDelete(null);
    }
  };

  // 모달 취소
  const cancelDelete = () => {
    setModalOpen(false);
    setUserToDelete(null);
  };

  // 사용자 추가 버튼 핸들러
  const handleAddUser = () => {
    navigate("/admin/users/create");
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}. ${month}. ${day}`;
  };

  return (
    <div className="user-management">
      <div className="content-card">
        <div className="user-management-header">
          <h1 className="page-title">회원 목록</h1>

          {/* 통계 카드 컨테이너는 주석 처리
          <div className="stats-container">
            <div className="stat-box">
              <span className="stat-label">총회원수</span>
              <span className="stat-value">{users.length}명</span>
            </div>

            <div className="stat-box connected-box">
              <span className="stat-label">지갑 연동</span>
              <span className="stat-value">
                {users.filter((user) => user.role === "ROLE_MEMBER").length}명
              </span>
            </div>

            <div className="stat-box disconnected-box">
              <span className="stat-label">지갑 미연동</span>
              <span className="stat-value">
                {
                  users.filter((user) => user.role === "ROLE_TEMP_MEMBER")
                    .length
                }
                명
              </span>
            </div>
          </div>
          */}
        </div>

        {/* 필터 및 검색 영역을 테이블 위로 이동 */}
        <div className="search-section">
          {/* 필터 컨트롤 */}
          <div className="filter-controls">
            {/* 정렬 옵션 선택 */}
            <div className="filter-group">
              <label htmlFor="sortOption">정렬: </label>
              <select
                id="sortOption"
                value={sortOption}
                onChange={handleSortChange}
                className="filter-select"
              >
                <option value="NAMES_ASC">이름 내림차순</option>
                <option value="REGISTER_DATE_ASC">가입날짜 오름차순</option>
                <option value="REGISTER_DATE_DESC">가입날짜 내림차순</option>
              </select>
            </div>

            {/* 지갑 연동 필터 */}
            <div className="filter-group">
              <label htmlFor="userRole">지갑 연동 여부:</label>
              <select
                id="userRole"
                value={userRole}
                onChange={handleRoleChange}
                className="filter-select"
              >
                <option value="">전체</option>
                <option value="ROLE_MEMBER">연동됨</option>
                <option value="ROLE_TEMP_MEMBER">미연동</option>
              </select>
            </div>
          </div>

          {/* 검색바 */}
          <div className="search-form">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="회원 검색"
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              <button type="submit" className="search-button">
                검색
              </button>
            </form>
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
                <th>지갑 연동</th>
                <th>가입날짜</th>
                <th>회원삭제</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.userId}
                  ref={index === users.length - 1 ? lastUserElementRef : null}
                >
                  <td>{user.employeeNumber}</td>
                  <td>{user.username}</td>
                  <td>{user.name}</td>
                  <td>
                    <span
                      className={`wallet-badge ${
                        user.role === "ROLE_MEMBER"
                          ? "wallet-connected"
                          : "wallet-disconnected"
                      }`}
                    >
                      {user.role === "ROLE_MEMBER" ? "연동됨" : "미연동"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => openDeleteModal(user.userId)}
                      disabled={user.role === "ROLE_ADMIN"} // 관리자는 삭제 불가
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
        <button className="add-button" onClick={handleAddUser}>
          추가
        </button>
      </div>
      
      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={modalOpen}
        title="회원 삭제"
        message="정말로 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default UserManagementPage;