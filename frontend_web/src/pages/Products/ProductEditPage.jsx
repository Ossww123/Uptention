// src/pages/Products/ProductEditPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./ProductEditPage.css";

const API_BASE_URL = "https://j12d211.p.ssafy.io";

const ProductEditPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams(); // URL에서 상품 ID 추출
  
  // 상품 데이터 상태
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 수정 가능한 필드만 별도 관리
  const [editableFields, setEditableFields] = useState({
    price: "",
    detail: "",
    quantity: ""
  });

  const [errors, setErrors] = useState({});

  // 상품 상세 정보 로드
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        
        // 토큰 가져오기
        const token = localStorage.getItem("auth-token");
        if (!token) {
          throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
        }

        const response = await axios.get(`${API_BASE_URL}/api/items/${itemId}`, {
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const productData = response.data;
        setProduct(productData);
        
        // 수정 가능한 필드 초기화
        setEditableFields({
          price: productData.price || "",
          detail: productData.detail || "",
          quantity: productData.quantity || ""
        });
        
      } catch (error) {
        console.error("상품 정보 로드 중 오류 발생:", error);
        
        let errorMessage = "상품 정보를 불러오는데 실패했습니다.";
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = "존재하지 않는 상품입니다.";
          } else if (error.response.status === 401) {
            errorMessage = "인증이 만료되었습니다. 다시 로그인해주세요.";
            // 로그인 페이지로 리다이렉트
            setTimeout(() => navigate('/login'), 1000);
          }
        }
        
        setErrors({ global: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [itemId, navigate]);

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "price") {
      // 음수와 0을 방지
      let processedValue = value;
      
      // 음수 부호 입력 방지
      if (processedValue.startsWith('-')) {
        processedValue = processedValue.substring(1);
      }
      
      // 0만 입력된 경우 빈 문자열로 설정
      if (/^0+$/.test(processedValue)) {
        processedValue = '';
      }
      // 앞자리에 0이 있는 경우 제거 (예: "01" -> "1")
      else if (processedValue.startsWith('0') && processedValue.length > 1) {
        processedValue = processedValue.replace(/^0+/, '');
      }
      
      // 허용 범위 검사 (1-5000)
      const numValue = parseInt(processedValue, 10);
      if (!isNaN(numValue) && numValue > 5000) {
        processedValue = '5000';
      }
      
      setEditableFields({
        ...editableFields,
        [name]: processedValue
      });
    } 
    else if (name === "quantity") {
      // 음수와 0을 방지
      let processedValue = value;
      
      // 음수 부호 입력 방지
      if (processedValue.startsWith('-')) {
        processedValue = processedValue.substring(1);
      }
      
      // 0만 입력된 경우 빈 문자열로 설정
      if (/^0+$/.test(processedValue)) {
        processedValue = '';
      }
      // 앞자리에 0이 있는 경우 제거 (예: "01" -> "1")
      else if (processedValue.startsWith('0') && processedValue.length > 1) {
        processedValue = processedValue.replace(/^0+/, '');
      }
      
      // 허용 범위 검사 (1-99)
      const numValue = parseInt(processedValue, 10);
      if (!isNaN(numValue) && numValue > 99) {
        processedValue = '99';
      }
      
      setEditableFields({
        ...editableFields,
        [name]: processedValue
      });
    }
    // 상품 설명의 경우 줄바꿈 제한 처리
    else if (name === "detail") {
      // 이모지 제거
      const processedValue = value.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
      
      // 줄 수 계산 (줄바꿈 + 1)
      const lines = processedValue.split('\n');
      const MAX_LINES = 5; // 최대 줄 수 제한
      
      if (lines.length > MAX_LINES) {
        // 최대 줄 수까지만 유지
        const limitedText = lines.slice(0, MAX_LINES).join('\n');
        setEditableFields({
          ...editableFields,
          [name]: limitedText
        });
      } else {
        setEditableFields({
          ...editableFields,
          [name]: processedValue
        });
      }
    }
    
    // 입력 값 변경 시 해당 필드의 에러 메시지 초기화
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    let firstErrorField = null;

    // price 유효성 검사
    if (editableFields.price !== "" && editableFields.price !== null) {
      if (isNaN(editableFields.price)) {
        newErrors.price = "유효한 가격을 입력해 주세요";
        isValid = false;
        if (!firstErrorField) firstErrorField = "price";
      } else if (editableFields.price < 1) {
        newErrors.price = "가격은 1원 이상이어야 합니다";
        isValid = false;
        if (!firstErrorField) firstErrorField = "price";
      } else if (editableFields.price > 5000) {
        newErrors.price = "가격은 5000원 이하여야 합니다";
        isValid = false;
        if (!firstErrorField) firstErrorField = "price";
      }
    }
    
    // detail 유효성 검사
    if (editableFields.detail !== "" && editableFields.detail !== null) {
      if (editableFields.detail.length > 255) {
        newErrors.detail = "상품 설명은 255자 이내로 입력해 주세요";
        isValid = false;
        if (!firstErrorField) firstErrorField = "detail";
      }
      
      // 줄 수 확인
      const lineCount = editableFields.detail.split('\n').length;
      const MAX_LINES = 5;
      
      if (lineCount > MAX_LINES) {
        newErrors.detail = `상품 설명은 최대 ${MAX_LINES}줄까지만 입력 가능합니다`;
        isValid = false;
        if (!firstErrorField) firstErrorField = "detail";
      }
      
      // 이모지 확인
      if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu.test(editableFields.detail)) {
        newErrors.detail = "상품 설명에 이모지를 사용할 수 없습니다";
        isValid = false;
        if (!firstErrorField) firstErrorField = "detail";
      }
    }
    
    // quantity 유효성 검사
    if (editableFields.quantity !== "" && editableFields.quantity !== null) {
      if (isNaN(editableFields.quantity) || !Number.isInteger(Number(editableFields.quantity))) {
        newErrors.quantity = "유효한 재고량을 입력해 주세요 (양의 정수)";
        isValid = false;
        if (!firstErrorField) firstErrorField = "quantity";
      } else if (editableFields.quantity < 1) {
        newErrors.quantity = "재고량은 1개 이상이어야 합니다";
        isValid = false;
        if (!firstErrorField) firstErrorField = "quantity";
      } else if (editableFields.quantity > 99) {
        newErrors.quantity = "재고량은 최대 99개까지 입력 가능합니다";
        isValid = false;
        if (!firstErrorField) firstErrorField = "quantity";
      }
    }
    
    // 최소 하나의 필드가 변경되었는지 확인
    const isAnyFieldChanged = 
      (editableFields.price !== "" && editableFields.price !== product.price) ||
      (editableFields.detail !== "" && editableFields.detail !== product.detail) ||
      (editableFields.quantity !== "" && editableFields.quantity !== product.quantity);
    
    if (!isAnyFieldChanged) {
      alert("변경된 내용이 없습니다");
      isValid = false;
      firstErrorField = "global"; // 변경 내용 없음 오류 추가
    }

    setErrors(newErrors);
    
    // 에러가 있는 필드로 스크롤
    if (!isValid) {
      setTimeout(() => {
        if (firstErrorField === "global") {
          // 전역 에러 메시지로 스크롤
          const errorElement = document.querySelector(".form-error-message");
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // 에러 메시지가 아직 렌더링되지 않았다면 상단으로 스크롤
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else if (firstErrorField) {
          // 특정 필드 에러로 스크롤
          const errorField = document.querySelector(`[name="${firstErrorField}"]`);
          if (errorField) {
            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorField.focus();
          }
        }
      }, 100);
    }
    
    return isValid;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!validateForm()) {
      // validateForm 내부에서 스크롤 처리
      return;
    }
    
    try {
      setSubmitting(true);
      
      // 토큰 가져오기
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }
      
      // 변경된 필드만 요청에 포함
      const updateData = {};
      
      if (editableFields.price !== "" && editableFields.price !== product.price) {
        updateData.price = editableFields.price;
      }
      
      if (editableFields.detail !== "" && editableFields.detail !== product.detail) {
        updateData.detail = editableFields.detail;
      }
      
      if (editableFields.quantity !== "" && editableFields.quantity !== product.quantity) {
        updateData.quantity = editableFields.quantity;
      }
      
      // API 호출
      const response = await axios.patch(
        `${API_BASE_URL}/api/items/${itemId}`,
        updateData,
        {
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(response)

      // 성공 처리
      alert("상품이 성공적으로 수정되었습니다.");
      
      // 상품 데이터 업데이트
      setProduct({
        ...product,
        ...updateData
      });
      
      // 성공 후 3초 뒤 상품 목록 페이지로 이동
      setTimeout(() => {
        navigate('/admin/products');
      }, 3000);
      
    } catch (error) {
      console.error("상품 수정 오류:", error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          // 유효성 검사 오류 처리
          if (data.message.includes("price")) {
            setErrors(prev => ({ ...prev, price: data.message }));
          } else if (data.message.includes("detail")) {
            setErrors(prev => ({ ...prev, detail: data.message }));
          } else if (data.message.includes("quantity")) {
            setErrors(prev => ({ ...prev, quantity: data.message }));
          } else {
            setErrors(prev => ({ ...prev, global: data.message || "입력 정보를 확인해주세요" }));
          }
        } else if (status === 404) {
          setErrors(prev => ({ ...prev, global: "상품을 찾을 수 없습니다" }));
        } else if (status === 401) {
          setErrors(prev => ({ ...prev, global: "인증이 만료되었습니다. 다시 로그인해주세요." }));
          // 로그인 페이지로 리다이렉트
          setTimeout(() => navigate('/login'), 1000);
        } else {
          setErrors(prev => ({ ...prev, global: "상품 수정 중 오류가 발생했습니다" }));
        }
      } else {
        setErrors(prev => ({ ...prev, global: "서버와 통신 중 오류가 발생했습니다" }));
      }
      
      // 에러 발생 시 에러 메시지로 스크롤
      setTimeout(() => {
        const errorElement = document.querySelector(".form-error-message");
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } finally {
      setSubmitting(false);
    }
  };

  // 목록 버튼 핸들러
  const handleGoToList = () => {
    navigate('/admin/products');
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="product-edit">
        <div className="content-card">
          <h1 className="page-title">상품 수정</h1>
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>상품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 상품 정보 로드 실패 시
  if (!product && !loading) {
    return (
      <div className="product-edit">
        <div className="content-card">
          <h1 className="page-title">상품 수정</h1>
          <div className="error-message">{errors.global || "상품 정보를 불러오는데 실패했습니다."}</div>
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/admin/products')}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-edit">
      <div className="content-card">
        <h1 className="page-title">상품 수정</h1>
        
        {/* 전역 에러 메시지 표시 */}
        {errors.global && <div className="form-error-message">{errors.global}</div>}
        
        <div className="sub-title">상품 정보</div>
        
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              {/* 카테고리 (수정 불가) */}
              <tr>
                <td className="label-cell">
                  <label>카테고리</label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <div className="non-editable-field">
                      <input
                        type="text"
                        value={product.categoryName || ""}
                        className="form-input disabled"
                        disabled
                      />
                    </div>
                  </div>
                </td>
              </tr>
              
              {/* 상품명 (수정 불가) */}
              <tr>
                <td className="label-cell">
                  <label>상품명</label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <div className="non-editable-field">
                      <input
                        type="text"
                        value={product.name || ""}
                        className="form-input disabled"
                        disabled
                      />
                    </div>
                  </div>
                </td>
              </tr>
              
              {/* 브랜드명 (수정 불가) */}
              <tr>
                <td className="label-cell">
                  <label>브랜드명</label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <div className="non-editable-field">
                      <input
                        type="text"
                        value={product.brand || ""}
                        className="form-input disabled"
                        disabled
                      />
                    </div>
                  </div>
                </td>
              </tr>
              
              {/* 가격 (수정 가능) */}
              <tr>
                <td className="label-cell">
                  <label>가격</label>
                </td>
                <td className="input-cell price-cell">
                  <div className="input-wrapper">
                    <div className="price-input-container">
                      <input
                        type="number"
                        name="price"
                        value={editableFields.price}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          // e, E, +, -를 차단
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className={`form-input price-input ${errors.price ? "has-error" : ""}`}
                        min="1"
                        max="5000"
                        placeholder={product.price}
                      />
                      <span className="price-currency">WORK</span>
                    </div>
                    <div className="field-hint">가격 범위: 1~5000 WORK</div>
                    {errors.price && <div className="error-hint price-error">{errors.price}</div>}
                  </div>
                </td>
              </tr>
              
              {/* 재고량 (수정 가능) */}
              <tr>
                <td className="label-cell">
                  <label>재고량</label>
                </td>
                <td className="input-cell price-cell">
                  <div className="input-wrapper">
                    <div className="price-input-container">
                      <input
                        type="number"
                        name="quantity"
                        value={editableFields.quantity}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          // e, E, +, -를 차단
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className={`form-input price-input ${errors.quantity ? "has-error" : ""}`}
                        min="1"
                        max="99"
                        step="1"
                        placeholder={product.quantity}
                      />
                      <span className="price-currency">개</span>
                    </div>
                    <div className="field-hint">재고량 범위: 1~99개</div>
                    {errors.quantity && <div className="error-hint price-error">{errors.quantity}</div>}
                  </div>
                </td>
              </tr>
              
              {/* 상품설명 (수정 가능) */}
              <tr>
                <td className="label-cell">
                  <label>상품설명</label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <textarea
                      name="detail"
                      value={editableFields.detail}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        // 이미 최대 줄 수에 도달했는지 확인
                        if (e.key === 'Enter') {
                          const currentLines = e.target.value.split('\n').length;
                          const MAX_LINES = 5;
                          if (currentLines >= MAX_LINES) {
                            e.preventDefault(); // 엔터 입력 방지
                          }
                        }
                      }}
                      className={`form-textarea ${errors.detail ? "has-error" : ""}`}
                      placeholder={product.detail || "상품 설명을 입력하세요 (최대 255자, 5줄 이내)"}
                      maxLength="255"
                      rows="5"
                    />
                    <div className="char-count">
                      {editableFields.detail.split('\n').length}/{5}줄, {editableFields.detail.length}/255자
                    </div>
                    {errors.detail && <div className="error-hint">{errors.detail}</div>}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="sub-title">상품 이미지</div>
          
          <div className="image-preview-section">
            <div className="image-preview-container">
              {product.images && product.images.length > 0 ? (
                <div className="product-images">
                  {product.images.map((imageUrl, index) => (
                    <div key={index} className="product-image-item">
                      <div className="non-editable-field">
                        <img 
                          src={imageUrl} 
                          alt={`상품 이미지 ${index + 1}`} 
                          className="product-image"
                        />
                      </div>
                      <div className="image-caption">
                        {index === 0 ? '대표 이미지' : `추가 이미지 ${index}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-images-message">등록된 이미지가 없습니다</div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleGoToList}
              disabled={submitting}
            >
              목록
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? "처리 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditPage;