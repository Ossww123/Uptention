import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductManagementPage.css';

const ProductManagementPage = () => {
  const navigate = useNavigate();
  
  // 상태 관리
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // 정렬 및 필터링 상태
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortOption, setSortOption] = useState('ID_ASC'); // 기본 정렬: ID 오름차순
  const pageSize = 20; // 페이지당 아이템 수
  
  // Refs
  const tableContainerRef = useRef(null); // 테이블 컨테이너에 대한 ref
  const isInitialMount = useRef(true); // 초기 마운트 플래그
  const observer = useRef(null); // Intersection Observer용 ref

  // debouncing을 위한 타이머 ref
  const debounceTimer = useRef(null);
  
  // API 기본 URL
  const API_BASE_URL = 'https://j12d211.p.ssafy.io';
  
  // 최신 상태를 추적하는 ref
  const stateRef = useRef({
    loading,
    hasMore,
    nextCursor,
    sortOption,
    selectedCategory,
    searchTerm
  });

  // ref 업데이트
  useEffect(() => {
    stateRef.current = {
      loading,
      hasMore,
      nextCursor,
      sortOption,
      selectedCategory,
      searchTerm
    };
  }, [loading, hasMore, nextCursor, sortOption, selectedCategory, searchTerm]);
  
  // 카테고리 목록을 API에서 가져오는 함수
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
      }

      const response = await axios.get(`${API_BASE_URL}/api/category`, {
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setCategories(response.data);
    } catch (err) {
      console.error('카테고리 로딩 오류:', err);
      setError('카테고리 정보를 불러오는 데 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 카테고리 로드
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // 정렬 옵션
  const sortOptions = [
    { id: "ID_ASC", name: "상품ID 순" },
    { id: "SALES", name: "인기 순" },
    { id: "LOW_PRICE", name: "가격 낮은순" },
    { id: "HIGH_PRICE", name: "가격 높은순" },
  ];

  // 상품 데이터를 가져오는 함수
  const fetchProducts = async (isSearch = false) => {
    const state = stateRef.current;
    
    if (state.loading || (!state.hasMore && !isSearch)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
      }

      const params = {
        size: pageSize,
        sort: state.sortOption || 'ID_ASC'
      };
      
      if (state.selectedCategory) {
        params.categoryId = state.selectedCategory;
      }
      
      if (state.searchTerm && state.searchTerm.trim() !== '') {
        params.keyword = state.searchTerm.trim();
      }
      
      if (state.nextCursor && !isSearch) {
        params.cursor = state.nextCursor;
      }

      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        params: params
      });
      
      const data = response.data;
      const validItems = data.items ? data.items.filter(item => item.itemId) : [];
      
      if (isSearch) {
        setProducts(validItems);
      } else {
        setProducts(prev => [...prev, ...validItems]);
      }
      
      setNextCursor(data.nextCursor);
      setHasMore(data.hasNextPage);
    } catch (err) {
      console.error('API 에러:', err);
      if (err.response) {
        const { status, data } = err.response;
        if (status === 401) {
          setError('인증이 만료되었습니다. 다시 로그인해주세요.');
          setTimeout(() => navigate('/login'), 2000);
        } else if (status === 400) {
          setError(data.message || '잘못된 요청입니다.');
        } else if (status === 500) {
          setError(data.message || '서버 오류가 발생했습니다.');
        } else {
          setError('상품 정보를 불러오는 데 실패했습니다.');
        }
      } else if (err.request) {
        setError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
      } else {
        setError(err.message || '상품 정보를 불러오는 데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 마지막 요소 참조 콜백 함수 
  const lastProductElementRef = (node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && stateRef.current.hasMore) {
        fetchProducts(false);
      }
    }, {
      root: tableContainerRef.current,
      rootMargin: '0px 0px 100px 0px',
      threshold: 0.1
    });
    
    if (node) observer.current.observe(node);
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 카테고리나 정렬 옵션 변경 시 실행
  useEffect(() => {
    if (!isInitialMount.current) {
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts(true);
    } else {
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortOption]);

  // 스크롤 이벤트 처리
  const handleScroll = () => {
    if (!tableContainerRef.current || loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;
    
    if (scrollBottom < 50) {
      fetchProducts(false);
    }
  };

  useEffect(() => {
    const currentRef = tableContainerRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => {
        currentRef.removeEventListener('scroll', handleScroll);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore]);

  // 검색 핸들러 - 디바운싱 적용
  const handleSearch = (e) => {
    e.preventDefault();

    // 기존 타이머가 있다면 클리어
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // 일정 시간(예: 200ms) 이후에 API 호출
    debounceTimer.current = setTimeout(() => {
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts(true);
    }, 200);
  };
  
  // 상품 추가 페이지로 이동
  const handleAddProduct = () => {
    navigate('/admin/products/create');
  };
  
  // 상품 수정 페이지로 이동
  const handleEditProduct = (productId) => {
    navigate(`/admin/products/${productId}`);
  };
  
  // 상품 삭제 핸들러
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
        }

        await axios.delete(`${API_BASE_URL}/api/items/${productId}`, {
          headers: {
            'Authorization': `${token}`
          }
        });
        
        setProducts(products.filter(product => product.itemId !== productId));
        alert('상품이 성공적으로 삭제되었습니다.');
      } catch (err) {
        console.error('상품 삭제 오류:', err);
        if (err.response) {
          alert(`상품 삭제에 실패했습니다: ${err.response.data.message || '알 수 없는 오류'}`);
        } else {
          alert('상품 삭제에 실패했습니다. 네트워크 연결을 확인해주세요.');
        }
      }
    }
  };
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId === "all" ? null : parseInt(categoryId));
  };
  
  // 정렬 옵션 변경 핸들러
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  return (
    <div className="product-management">
      <div className="content-card">
        <div className="product-management-header">
          <h1 className="page-title">상품 관리</h1>
        </div>
        
        <div className="search-section">
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="category-select">카테고리:</label>
              <select 
                id="category-select"
                value={selectedCategory || "all"}
                onChange={handleCategoryChange}
                className="filter-select"
              >
                <option value="all">전체</option>
                {categories && categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="sort-select">정렬:</label>
              <select 
                id="sort-select"
                value={sortOption}
                onChange={handleSortChange}
                className="filter-select"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              maxLength={30} // 여기서 30자 제한을 지정
              placeholder="상품명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button" disabled={loading}>
              검색
            </button>
          </form>
        </div>
        
        <div className="products-table-container" ref={tableContainerRef}>
          {error && <div className="error-message">{error}</div>}
          
          <table className="products-table">
            <thead>
              <tr>
                <th>상품ID</th>
                <th>상품명</th>
                <th>브랜드명</th>
                <th>카테고리</th>
                <th>가격(WORK)</th>
                <th>재고</th>
                <th>판매량</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product, index) => (
                  <tr 
                    key={product.itemId}
                    ref={index === products.length - 1 ? lastProductElementRef : null}
                    onClick={() => handleEditProduct(product.itemId)}
                    className="product-row"
                  >
                    <td>{product.itemId}</td>
                    <td>{product.name}</td>
                    <td>{product.brand}</td>
                    <td>{product.categoryName}</td>
                    <td>{product.price}</td>
                    <td>
                      {product.quantity === 0 ? (
                        <span className="sold-out-badge">품절😢</span>
                      ) : (
                        product.quantity
                      )}
                    </td>
                    <td>{product.salesCount}</td>
                    <td className="product-table-action-buttons">
                      <button 
                        className="product-table-edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product.itemId);
                        }}
                      >
                        수정
                      </button>
                      <button 
                        className="product-table-delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product.itemId);
                        }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
          
          {!loading && products.length === 0 && (
            <div className="no-products-message">
              <p>등록된 상품이 없습니다.</p>
            </div>
          )}
          
          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>상품을 불러오는 중...</p>
            </div>
          )}
        </div>
      </div>
  
      <div className="action-buttons">
        <button 
          className="add-button"
          onClick={handleAddProduct}
        >
          추가
        </button>
      </div>
    </div>
  );
};

export default ProductManagementPage;