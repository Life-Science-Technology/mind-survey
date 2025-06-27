import { useState, useEffect, useCallback } from 'react';

// 전화번호 형식 검증
export const validatePhoneNumber = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('010') && digits.length === 11;
};

// 전화번호 형식화 함수 (010- 고정)
export const formatPhoneNumber = (phone) => {
  const digits = phone.replace(/\D/g, '').slice(0, 11); // 11자리로 제한
  
  // 항상 010으로 시작하도록 보장
  if (digits.length <= 3) {
    return '010-'; // 항상 010- 형태로 표시
  } else if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
};

// 전화번호 입력 처리 커스텀 훅
export const usePhoneNumber = (initialValue = '', onPhoneChange = () => {}) => {
  const [phoneFormatted, setPhoneFormatted] = useState('010-');
  const [phoneError, setPhoneError] = useState('');

  // 전화번호 초기화
  useEffect(() => {
    if (initialValue && initialValue.length > 3) {
      setPhoneFormatted(formatPhoneNumber(initialValue));
    } else if (!initialValue || initialValue === '010') {
      // 전화번호가 없거나 010만 있으면 010-으로 고정
      setPhoneFormatted('010-');
    }
  }, [initialValue]);

  // 전화번호 입력 처리 함수
  const handlePhoneChange = useCallback((e) => {
    const { value } = e.target;
    let digits = value.replace(/\D/g, '');
    
    // 010이 지워지려고 하면 010으로 고정
    if (digits.length < 3) {
      digits = '010';
    } else if (!digits.startsWith('010')) {
      // 010으로 시작하지 않으면, 앞 3자리를 010으로 강제 변경하고 나머지 숫자 유지
      digits = '010' + digits.slice(3);
    }
    
    // 11자리를 초과하는 입력은 무시
    if (digits.length > 11) {
      digits = digits.slice(0, 11);
    }
    
    // 전화번호 검증 및 에러 메시지 설정
    if (digits.length === 3) {
      setPhoneError('');
    } else if (digits.length > 3 && digits.length < 11) {
      setPhoneError('전화번호는 11자리여야 합니다.');
    } else if (digits.length === 11) {
      setPhoneError('');
    }
    
    const formatted = formatPhoneNumber(digits);
    setPhoneFormatted(formatted);
    
    // 상위 컴포넌트에 변경사항 전달
    onPhoneChange(digits);
  }, [onPhoneChange]);

  return {
    phoneFormatted,
    phoneError,
    handlePhoneChange,
    isValidPhone: validatePhoneNumber(initialValue)
  };
}; 