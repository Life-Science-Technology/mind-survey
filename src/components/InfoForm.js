import React, { useState, useEffect, useCallback } from 'react';

const InfoForm = ({ userData, updateUserData, nextPage }) => {
  // State for validation messages
  const [emailError, setEmailError] = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Format phone number with hyphens (XXX-XXXX-XXXX for Korean numbers)
  // useCallback을 사용하여 함수 재생성 방지
  const formatPhoneNumber = useCallback((phone) => {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Apply formatting based on the number of digits
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
  }, []);

  // Initialize formatted phone state
  useEffect(() => {
    if (userData.phone) {
      setPhoneFormatted(formatPhoneNumber(userData.phone));
    }
  }, [userData.phone, formatPhoneNumber]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Final validation check before proceeding
    if (!validateEmail(userData.email)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
      return;
    }
    
    // 전화번호 검증
    if (!validatePhoneNumber(userData.phone)) {
      setPhoneError('전화번호는 010으로 시작해야 합니다.');
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

  // 전화번호 유효성 검사
  const [phoneError, setPhoneError] = useState('');

  // 전화번호가 010으로 시작하는지 확인
  const validatePhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('010');
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

  // Handle phone input changes
  const handlePhoneChange = (e) => {
    const { value } = e.target;
    
    // 숫자만 추출
    const digits = value.replace(/\D/g, '');
    
    // 010으로 시작하는지 확인
    if (digits.length >= 3 && !digits.startsWith('010')) {
      setPhoneError('전화번호는 010으로 시작해야 합니다.');
    } else {
      setPhoneError('');
    }
    
    const formatted = formatPhoneNumber(value);
    setPhoneFormatted(formatted);
    
    // Store the digits only in userData
    updateUserData({ phone: digits });
  };

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
