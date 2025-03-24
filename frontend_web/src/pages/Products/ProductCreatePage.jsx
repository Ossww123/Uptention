// src/pages/Products/ProductCreatePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCreatePage.css';

const ProductCreatePage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    category: '',
    productName: '',
    brandName: '',
    price: '0.0',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [mainImage, setMainImage] = useState(null);
  const [subImages, setSubImages] = useState([null, null]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSubImages = [...subImages];
        newSubImages[index] = reader.result;
        setSubImages(newSubImages);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const newErrors = {};
    if (!formData.category) {
      newErrors.category = '카테고리를 선택해 주세요';
    }
    if (!formData.productName) {
      newErrors.productName = '상품명을 입력해 주세요';
    }
    if (!formData.brandName) {
      newErrors.brandName = '브랜드명을 입력해 주세요';
    }
    if (!mainImage) {
      newErrors.mainImage = '대표 이미지는 필수입니다';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 여기에 API 호출 로직 추가 (실제 구현 시)
    console.log('제출할 데이터:', formData);
    console.log('이미지:', { mainImage, subImages });
    
    // 성공 시 상품 목록 페이지로 리다이렉트
    alert('상품이 등록되었습니다.');
    navigate('/admin/products');
  };
  
  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 있습니다. 취소하시겠습니까?')) {
      navigate('/admin/products');
    }
  };
  
  return (
    <div className="product-create">
      <div className="content-card">
        <h1 className="page-title">상품 등록</h1>
        
        <div className="sub-title">상품 정보</div>
        
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>카테고리<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <select 
                    name="category" 
                    value={formData.category}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">선택해 주세요</option>
                    <option value="가전디지털">가전디지털</option>
                    <option value="뷰티">뷰티</option>
                    <option value="리빙/키친">리빙/키친</option>
                    <option value="패션의류/잡화">패션의류/잡화</option>
                    <option value="문화여가">문화여가</option>
                    <option value="생활용품">생활용품</option>
                    <option value="식품">식품</option>
                    <option value="키즈">키즈</option>
                  </select>
                  {errors.category && <div className="error-message">{errors.category}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>상품명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="text" 
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="상품명 입력(최대 30자)"
                    maxLength="30"
                  />
                  {errors.productName && <div className="error-message">{errors.productName}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>브랜드명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="text" 
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="브랜드명 입력(최대 30자)"
                    maxLength="30"
                  />
                  {errors.brandName && <div className="error-message">{errors.brandName}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>가격<span className="required">*</span></label>
                </td>
                <td className="input-cell price-cell">
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="form-input price-input"
                    step="0.1"
                    min="0"
                  />
                  <span className="price-currency">WORK</span>
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>상품설명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="상품설명 입력(최대 255자)"
                    maxLength="255"
                    rows="5"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="sub-title">상품 이미지</div>
          
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>대표이미지<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <div className="image-upload-area">
                    <div className="image-upload-box">
                      {mainImage ? (
                        <div className="image-preview">
                          <img src={mainImage} alt="대표 이미지" />
                          <button 
                            type="button" 
                            onClick={() => setMainImage(null)}
                            className="remove-image-btn"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <input 
                            type="file" 
                            id="main-image" 
                            accept="image/*" 
                            onChange={handleMainImageChange} 
                            hidden
                          />
                          <label htmlFor="main-image" className="image-upload-btn">
                            <div className="camera-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF6B6B">
                                <path d="M9,3L7.17,5H4C2.9,5 2,5.9 2,7V19C2,20.1 2.9,21 4,21H20C21.1,21 22,20.1 22,19V7C22,5.9 21.1,5 20,5H16.83L15,3H9M12,18C9.24,18 7,15.76 7,13C7,10.24 9.24,8 12,8C14.76,8 17,10.24 17,13C17,15.76 14.76,18 12,18M12,17C14.08,17 15.8,15.28 15.8,13.2C15.8,11.12 14.08,9.4 12,9.4C9.92,9.4 8.2,11.12 8.2,13.2C8.2,15.28 9.92,17 12,17Z" />
                              </svg>
                            </div>
                          </label>
                        </>
                      )}
                    </div>
                    <div className="image-upload-text">
                      상품 대표이미지는 필수값 입니다.
                    </div>
                    {errors.mainImage && <div className="error-message">{errors.mainImage}</div>}
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>서브이미지<br />(최대 2개)</label>
                </td>
                <td className="input-cell">
                  <div className="image-upload-area">
                    <div className="sub-images-container">
                      {subImages.map((img, index) => (
                        <div key={index} className="image-upload-box">
                          {img ? (
                            <div className="image-preview">
                              <img src={img} alt={`서브 이미지 ${index + 1}`} />
                              <button 
                                type="button" 
                                onClick={() => {
                                  const newSubImages = [...subImages];
                                  newSubImages[index] = null;
                                  setSubImages(newSubImages);
                                }}
                                className="remove-image-btn"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <>
                              <input 
                                type="file" 
                                id={`sub-image-${index}`} 
                                accept="image/*" 
                                onChange={(e) => handleSubImageChange(e, index)} 
                                hidden
                              />
                              <label htmlFor={`sub-image-${index}`} className="image-upload-btn">
                                <div className="camera-icon">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#4CAF50">
                                    <path d="M9,3L7.17,5H4C2.9,5 2,5.9 2,7V19C2,20.1 2.9,21 4,21H20C21.1,21 22,20.1 22,19V7C22,5.9 21.1,5 20,5H16.83L15,3H9M12,18C9.24,18 7,15.76 7,13C7,10.24 9.24,8 12,8C14.76,8 17,10.24 17,13C17,15.76 14.76,18 12,18M12,17C14.08,17 15.8,15.28 15.8,13.2C15.8,11.12 14.08,9.4 12,9.4C9.92,9.4 8.2,11.12 8.2,13.2C8.2,15.28 9.92,17 12,17Z" />
                                  </svg>
                                </div>
                              </label>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="label-cell"></td>
                <td className="input-cell image-note">
                  <ul>
                    <li>정사각형 이미지 사용 (360 X 360 권장)</li>
                    <li>JPG, JPEG, PNG 형식 파일 등록</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancel}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="submit-button"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreatePage;