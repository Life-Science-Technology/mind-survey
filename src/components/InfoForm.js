import React, { useState, useEffect } from 'react';
import { validatePhoneNumber, usePhoneNumber } from '../utils/phoneNumberUtils';

const InfoForm = ({ userData, updateUserData, nextPage }) => {
  // State for validation messages
  const [emailError, setEmailError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 전화번호 관리 (커스텀 훅 사용)
  const {
    phoneFormatted,
    phoneError,
    handlePhoneChange
  } = usePhoneNumber(userData.phone, (phone) => updateUserData({ phone }));

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Final validation check before proceeding
    if (!validateEmail(userData.email)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
      return;
    }
    
    // 전화번호 검증은 커스텀 훅에서 처리되므로 추가 검증 불필요
    if (!validatePhoneNumber(userData.phone)) {
      return;
    }
    
    nextPage();
  };

  // Handle email input changes
  const handleEmailChange = (e) => {
    const { value } = e.target;
    updateUserData({ email: value });
    
    // Validate email as the user types
    if (value && !validateEmail(value)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
    } else {
      setEmailError('');
    }
  };


  
  // 폼 유효성 검사
  useEffect(() => {
    // 모든 필수 필드가 채워져 있고 오류가 없는지 확인
    const isValid = (
      userData.email && 
      userData.name && 
      userData.phone && 
      !emailError && 
      !phoneError &&
      validatePhoneNumber(userData.phone)
    );
    
    setIsFormValid(isValid);
  }, [userData.email, userData.name, userData.phone, emailError, phoneError]);



  // Handle regular input changes (for name)
  const handleChange = (e) => {
    const { id, value } = e.target;
    updateUserData({ [id]: value });
  };
  
  return (
    <div className="form-container">
      <h1>정신건강 설문조사</h1>
      <p>아래 정보를 입력해주세요.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input 
            type="email" 
            id="email" 
            value={userData.email}
            onChange={handleEmailChange}
            required
            className={emailError ? 'input-error' : ''}
          />
          {emailError && <p className="error-message">{emailError}</p>}
        </div>
        
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input 
            type="text" 
            id="name" 
            value={userData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">전화번호</label>
          <input 
            type="tel" 
            id="phone" 
            value={phoneFormatted}
            onChange={handlePhoneChange}
            placeholder="010-0000-0000"
            required
            className={phoneError ? 'input-error' : ''}
          />
          {phoneError ? (
            <p className="error-message">{phoneError}</p>
          ) : (
            <p className="helper-text">형식: 010-0000-0000</p>
          )}
        </div>
        
        <button 
          type="submit" 
          className={`btn next-btn ${!isFormValid ? 'btn-disabled' : ''}`}
          disabled={!isFormValid}
        >
          다음
        </button>
      </form>
    </div>
  );
};

export default InfoForm;
