// src/pages/Users/UserCreatePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserCreatePage.css";
import axios from "axios";
import UserConfirmModal from "../../components/UserConfirmModal/UserConfirmModal"; // 경로는 실제 프로젝트 구조에 맞게 조정하세요

const BASE_URL = "https://j12d211.p.ssafy.io";

const UserCreatePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    employeeNumber: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [isCheckingEmpNum, setIsCheckingEmpNum] = useState(false);
  const [isIdAvailable, setIsIdAvailable] = useState(false);
  const [isEmpNumAvailable, setIsEmpNumAvailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 모달 관련 상태
  const [modalOpen, setModalOpen] = useState(false);

  // 비밀번호 표시/숨김 토글 함수
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // 폼 필드 상태 변경 시 에러 메시지 초기화
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 이모지 제거 함수
    const removeEmojis = (text) => {
      return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
    };

    if (name === "name" || name === "username" || name === "password" || name === "confirmPassword") {
      // 이모지 제거 처리
      const processedValue = removeEmojis(value);
      
      setFormData({
        ...formData,
        [name]: processedValue
      });
    }
    else if (name === "employeeNumber") {
      // 사원번호: 영어와 숫자만 허용
      const processedValue = removeEmojis(value).replace(/[^a-zA-Z0-9]/g, '');
      
      setFormData({
        ...formData,
        [name]: processedValue
      });
    }
    else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // 값이 변경되면 중복 확인 상태 초기화
    if (name === "username") {
      setIsIdAvailable(false);
    } else if (name === "employeeNumber") {
      setIsEmpNumAvailable(false);
    }

    // 해당 필드의 오류 메시지 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // 중복 ID 체크
  const checkIdDuplicate = async () => {
    // 유효성 검사
    if (!formData.username) {
      setErrors((prev) => ({
        ...prev,
        username: "아이디를 입력해 주세요",
      }));
      return;
    }

    // 정규식 검사 - 영어 소문자와, 숫자만 사용 가능, 8~15자
    const idRegex = /^[a-z0-9]{8,15}$/;
    if (!idRegex.test(formData.username)) {
      setErrors((prev) => ({
        ...prev,
        username:
          "아이디는 영어 소문자와 숫자만 사용 가능하며 8~15자여야 합니다",
      }));
      return;
    }

    setIsCheckingId(true);

    try {
      // API 호출
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }

      await axios.get(
        `${BASE_URL}/api/join/check-username?username=${formData.username}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      // 서버 응답 처리 - 200 OK는 사용 가능한 경우
      setIsIdAvailable(true);
      setErrors((prev) => ({
        ...prev,
        username: "",
      }));
      alert("사용 가능한 아이디입니다.");
    } catch (error) {
      setIsIdAvailable(false);

      // 409 Conflict는 이미 사용 중인 경우
      if (error.response && error.response.status === 409) {
        const errorMsg =
          error.response.data.message || "이미 사용 중인 아이디입니다";
        setErrors((prev) => ({
          ...prev,
          username: errorMsg,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          username: "중복 확인 중 오류가 발생했습니다",
        }));
      }
    } finally {
      setIsCheckingId(false);
    }
  };

  // 사원번호 중복 체크
  const checkEmpNumDuplicate = async () => {
    // 유효성 검사
    if (!formData.employeeNumber) {
      setErrors((prev) => ({
        ...prev,
        employeeNumber: "사원번호를 입력해 주세요",
      }));
      return;
    }

    // 정규식 검사 - 영어와 숫자만, 1~20자
    const empNumRegex = /^[a-zA-Z0-9]{1,20}$/;
    if (!empNumRegex.test(formData.employeeNumber)) {
      setErrors((prev) => ({
        ...prev,
        employeeNumber:
          "사원번호는 영어와 숫자만 사용 가능하며 1~20자여야 합니다",
      }));
      return;
    }

    setIsCheckingEmpNum(true);

    try {
      // API 호출
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }

      await axios.get(
        `${BASE_URL}/api/join/check-employee-number?employeeNumber=${formData.employeeNumber}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      // 서버 응답 처리 - 200 OK는 사용 가능한 경우
      setIsEmpNumAvailable(true);
      setErrors((prev) => ({
        ...prev,
        employeeNumber: "",
      }));
      alert("사용 가능한 사번입니다.");
    } catch (error) {
      setIsEmpNumAvailable(false);

      // 409 Conflict는 이미 사용 중인 경우
      if (error.response && error.response.status === 409) {
        const errorMsg =
          error.response.data.message || "이미 사용 중인 사번입니다";
        setErrors((prev) => ({
          ...prev,
          employeeNumber: errorMsg,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          employeeNumber: "중복 확인 중 오류가 발생했습니다",
        }));
      }
    } finally {
      setIsCheckingEmpNum(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // 이름 검증 (한글과 영어만, 2~20자)
    const nameRegex = /^[가-힣a-zA-Z]{2,20}$/;
    if (!formData.name) {
      newErrors.name = "성명을 입력해 주세요";
      isValid = false;
    } else if (!nameRegex.test(formData.name)) {
      newErrors.name = "성명은 한글과 영어만 사용 가능하며 2~20자여야 합니다";
      isValid = false;
    }

    // 사원번호 검증 (영어와 숫자만, 1~20자)
    const employeeNumberRegex = /^[a-zA-Z0-9]{1,20}$/;
    if (!formData.employeeNumber) {
      newErrors.employeeNumber = "사원번호를 입력해 주세요";
      isValid = false;
    } else if (!employeeNumberRegex.test(formData.employeeNumber)) {
      newErrors.employeeNumber =
        "사원번호는 영어와 숫자만 사용 가능하며 1~20자여야 합니다";
      isValid = false;
    } else if (!isEmpNumAvailable) {
      newErrors.employeeNumber = "사원번호 중복 확인이 필요합니다";
      isValid = false;
    }

    // 아이디 검증 (영어 소문자와 숫자만, 8~15자)
    const idRegex = /^[a-z0-9]{8,15}$/;
    if (!formData.username) {
      newErrors.username = "아이디를 입력해 주세요";
      isValid = false;
    } else if (!idRegex.test(formData.username)) {
      newErrors.username =
        "아이디는 영어 소문자와 숫자만 사용 가능하며 8~15자여야 합니다";
      isValid = false;
    } else if (!isIdAvailable) {
      newErrors.username = "아이디 중복 확인이 필요합니다";
      isValid = false;
    }

    // 비밀번호 검증 (영문, 숫자 포함, 특수문자 선택적, 8~15자)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,15}$/;
    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해 주세요";
      isValid = false;
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "비밀번호는 영문, 숫자가 반드시 포함되어야 하며 8~15자여야 합니다";
      isValid = false;
    }

    // 비밀번호 확인
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호 확인을 입력해 주세요";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 폼 제출 전 확인 모달 열기
  const openConfirmModal = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setModalOpen(true);
  };

  // 모달 확인 버튼 클릭 시 실제 폼 제출
  const handleSubmit = async () => {
    try {
      // 필요없는 confirmPassword 제거
      const { confirmPassword, ...dataToSubmit } = formData;

      // 토큰 가져오기
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }

      // API 호출
      await axios.post(`${BASE_URL}/api/join`, dataToSubmit, {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      });

      // 성공 응답 처리
      alert("회원가입 성공");
      navigate("/admin/users");
    } catch (error) {

      if (error.response) {
        const { status, data } = error.response;

        // 400 오류: 잘못된 요청
        if (status === 400) {
          alert(data.message || "입력 정보를 확인해주세요.");
        }
        // 409 오류: 중복된 아이디 또는 사번
        else if (status === 409) {
          if (data.code === "AUTH_006") {
            setErrors((prev) => ({
              ...prev,
              username: data.message || "아이디가 이미 사용중입니다.",
            }));
            setIsIdAvailable(false);
          } else if (data.code === "AUTH_005") {
            setErrors((prev) => ({
              ...prev,
              employeeNumber: data.message || "사번이 이미 사용중입니다.",
            }));
            setIsEmpNumAvailable(false);
          } else {
            alert(data.message || "회원 등록에 실패했습니다.");
          }
        } else {
          alert("회원 등록에 실패했습니다. 다시 시도해 주세요.");
        }
      } else if (error.request) {
        alert("서버 응답이 없습니다. 네트워크 연결을 확인해주세요.");
      } else {
        alert(error.message || "회원 등록 중 오류가 발생했습니다.");
      }
    } finally {
      // 모달 닫기
      setModalOpen(false);
    }
  };

  // 모달 취소
  const cancelModal = () => {
    setModalOpen(false);
  };

  const handleCancel = () => {
    // 폼에 데이터가 입력되었는지 확인
    const hasInput =
      formData.name.trim() !== "" ||
      formData.employeeNumber.trim() !== "" ||
      formData.username.trim() !== "" ||
      formData.password.trim() !== "" ||
      formData.confirmPassword.trim() !== "";

    // 입력된 내용이 있으면 확인 창 표시, 없으면 바로 이동
    if (!hasInput) {
      navigate("/admin/users");
    } else if (window.confirm("작성 중인 내용이 있습니다. 취소하시겠습니까?")) {
      navigate("/admin/users");
    }
  };

  return (
    <div className="user-create">
      <div className="content-card">
        <h1 className="page-title">회원 등록</h1>

        <div className="sub-title">회원 정보</div>

        <form onSubmit={openConfirmModal}>
          <table className="form-table">
            <tbody>
              <tr>
                <td className="label-cell">
                  <label>
                    성명<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`form-input ${errors.name ? "has-error" : ""}`}
                      placeholder="성명 입력 (2~20자, 한글/영어만 가능)"
                      maxLength="20"
                    />
                    {errors.name && (
                      <div className="error-hint">{errors.name}</div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    사원번호<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <div className="id-check-container">
                      <input
                        type="text"
                        name="employeeNumber"
                        value={formData.employeeNumber}
                        onChange={handleChange}
                        className={`form-input ${
                          errors.employeeNumber ? "has-error" : ""
                        }`}
                        placeholder="사원번호 입력 (1~20자, 영어/숫자만 가능)"
                        maxLength="20"
                      />
                      <button
                        type="button"
                        className="id-check-button"
                        onClick={checkEmpNumDuplicate}
                        disabled={isCheckingEmpNum}
                      >
                        {isCheckingEmpNum ? "확인 중..." : "중복 확인"}
                      </button>
                    </div>
                    {errors.employeeNumber && (
                      <div className="error-hint">{errors.employeeNumber}</div>
                    )}
                    {isEmpNumAvailable && (
                      <div className="success-hint">사용 가능한 사번입니다</div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    회원 ID<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <div className="id-check-container">
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`form-input ${
                          errors.username ? "has-error" : ""
                        }`}
                        placeholder="회원 ID 입력 (8~15자, 영소문자/숫자만 가능)"
                        maxLength="15"
                      />
                      <button
                        type="button"
                        className="id-check-button"
                        onClick={checkIdDuplicate}
                        disabled={isCheckingId}
                      >
                        {isCheckingId ? "확인 중..." : "중복 확인"}
                      </button>
                    </div>
                    {errors.username && (
                      <div className="error-hint">{errors.username}</div>
                    )}
                    {isIdAvailable && (
                      <div className="success-hint">
                        사용 가능한 아이디입니다
                      </div>
                    )}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    비밀번호<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <div className="password-input-container">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-input ${
                          errors.password ? "has-error" : ""
                        }`}
                        placeholder="비밀번호 입력 (8~15자, 영문/숫자 필수)"
                        maxLength="15"
                      />
                      <button
                        type="button"
                        className="password-toggle-button"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? "숨기기" : "보기"}
                      </button>
                    </div>
                    <div className="password-message-container">
                      <div className="password-hint">
                        사용 가능한 특수문자: ! @ # $ % ^ & *
                      </div>
                      {errors.password && (
                        <div className="error-hint">{errors.password}</div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>

              <tr>
                <td className="label-cell">
                  <label>
                    비밀번호 확인<span className="required">*</span>
                  </label>
                </td>
                <td className="input-cell">
                  <div className="input-wrapper">
                    <div className="password-input-container">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`form-input ${
                          errors.confirmPassword ? "has-error" : ""
                        }`}
                        placeholder="비밀번호 다시 입력"
                        maxLength="15"
                      />
                      <button
                        type="button"
                        className="password-toggle-button"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? "숨기기" : "보기"}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="error-hint">{errors.confirmPassword}</div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>

      <div className="form-actions outside-card">
        <button
          type="button"
          className="user-cancel-button"
          onClick={handleCancel}
        >
          취소
        </button>
        <button
          type="button"
          className="user-submit-button"
          onClick={openConfirmModal}
        >
          등록
        </button>
      </div>

      {/* 회원 정보 확인 모달 */}
      <UserConfirmModal
        isOpen={modalOpen}
        userData={formData}
        onConfirm={handleSubmit}
        onCancel={cancelModal}
      />
    </div>
  );
};

export default UserCreatePage;