// src/pages/Users/UserCreatePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserCreatePage.css';
import axios from 'axios'; // axios 사용, 필요시 설치: npm install axios

const UserCreatePage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    employeeNumber: '',
    userId: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false); // 중복 확인 중 상태
  const [isIdAvailable, setIsIdAvailable] = useState(false); // ID 사용 가능 여부
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // userId가 변경되면 중복 확인 상태 초기화
    if (name === 'userId') {
      setIsIdAvailable(false);
    }
  };
  
  // 중복 ID 체크
  const checkIdDuplicate = async () => {
    // 유효성 검사
    if (!formData.userId) {
      setErrors(prev => ({
        ...prev,
        userId: '아이디를 입력해 주세요'
      }));
      return;
    }
    
    // 정규식 검사 - 영어 소문자와, 숫자만 사용 가능, 8~15자
    const idRegex = /^[a-z0-9]{8,15}$/;
    if (!idRegex.test(formData.userId)) {
      setErrors(prev => ({
        ...prev,
        userId: '아이디는 영어 소문자와 숫자만 사용 가능하며 8~15자여야 합니다'
      }));
      return;
    }
    
    setIsChecking(true);
    
    try {
      // 실제 API 호출할 때 사용
      const response = await axios.get(`/api/users/check-id?userId=${formData.userId}`);
      
      // 서버 응답 처리
      if (response.data.isAvailable) {
        setIsIdAvailable(true);
        setErrors(prev => ({
          ...prev,
          userId: ''
        }));
        alert('사용 가능한 아이디입니다.');
      } else {
        setIsIdAvailable(false);
        setErrors(prev => ({
          ...prev,
          userId: '이미 사용 중인 아이디입니다'
        }));
      }
    } catch (error) {
      console.error('ID 중복 확인 중 오류 발생:', error);
      setErrors(prev => ({
        ...prev,
        userId: '중복 확인 중 오류가 발생했습니다'
      }));
    } finally {
      setIsChecking(false);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // 이름 검증 (한글과 영어만, 2~20자)
    const nameRegex = /^[가-힣a-zA-Z]{2,20}$/;
    if (!formData.name) {
      newErrors.name = '성명을 입력해 주세요';
      isValid = false;
    } else if (!nameRegex.test(formData.name)) {
      newErrors.name = '성명은 한글과 영어만 사용 가능하며 2~20자여야 합니다';
      isValid = false;
    }
    
    // 사원번호 검증 (영어와 숫자만, 1~20자)
    const employeeNumberRegex = /^[a-zA-Z0-9]{1,20}$/;
    if (!formData.employeeNumber) {
      newErrors.employeeNumber = '사원번호를 입력해 주세요';
      isValid = false;
    } else if (!employeeNumberRegex.test(formData.employeeNumber)) {
      newErrors.employeeNumber = '사원번호는 영어와 숫자만 사용 가능하며 1~20자여야 합니다';
      isValid = false;
    }
    
    // 아이디 검증 (영어 소문자와 숫자만, 8~15자)
    const idRegex = /^[a-z0-9]{8,15}$/;
    if (!formData.userId) {
      newErrors.userId = '아이디를 입력해 주세요';
      isValid = false;
    } else if (!idRegex.test(formData.userId)) {
      newErrors.userId = '아이디는 영어 소문자와 숫자만 사용 가능하며 8~15자여야 합니다';
      isValid = false;
    } else if (!isIdAvailable) {
      newErrors.userId = '아이디 중복 확인이 필요합니다';
      isValid = false;
    }
    
    // 비밀번호 검증 (영문, 숫자 포함, 8~15자)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,15}$/;
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해 주세요';
      isValid = false;
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = '비밀번호는 영문, 숫자가 반드시 포함되어야 하며 8~15자여야 합니다';
      isValid = false;
    }
    
    // 비밀번호 확인
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해 주세요';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // 필요없는 confirmPassword 제거
      const { confirmPassword, ...dataToSubmit } = formData;
      
      // 실제 API 호출
      await axios.post('/api/users', dataToSubmit);
      
      alert('회원이 등록되었습니다.');
      navigate('/admin/users');
    } catch (error) {
      console.error('회원 등록 중 오류 발생:', error);
      alert('회원 등록에 실패했습니다. 다시 시도해 주세요.');
    }
  };
  
  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 있습니다. 취소하시겠습니까?')) {
      navigate('/admin/users');
    }
  };
  
  return (
    <div className="user-create">
      <div className="content-card">
        <h1 className="page-title">회원 등록</h1>
        
        <div className="sub-title">회원 정보</div>
        
        <form onSubmit={handleSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>성명<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="성명 입력 (2~20자, 한글/영어만 가능)"
                    maxLength="20"
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>사원번호<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="text" 
                    name="employeeNumber"
                    value={formData.employeeNumber}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="사원번호 입력 (1~20자, 영어/숫자만 가능)"
                    maxLength="20"
                  />
                  {errors.employeeNumber && <div className="error-message">{errors.employeeNumber}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>회원 ID<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <div className="id-check-container">
                    <input 
                      type="text" 
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="회원 ID 입력 (8~15자, 영소문자/숫자만 가능)"
                      maxLength="15"
                    />
                    <button 
                      type="button" 
                      className="id-check-button"
                      onClick={checkIdDuplicate}
                      disabled={isChecking}
                    >
                      {isChecking ? '확인 중...' : '중복 확인'}
                    </button>
                  </div>
                  {errors.userId && <div className="error-message">{errors.userId}</div>}
                  {isIdAvailable && <div className="success-message">사용 가능한 아이디입니다</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>비밀번호<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="비밀번호 입력 (8~15자, 영문/숫자 포함)"
                    maxLength="15"
                  />
                  {errors.password && <div className="error-message">{errors.password}</div>}
                </td>
              </tr>
              
              <tr>
                <td className="label-cell">
                  <label>비밀번호 확인<span className="required">*</span></label>
                </td>
                <td className="input-cell">
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="비밀번호 다시 입력"
                    maxLength="15"
                  />
                  {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
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
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreatePage;