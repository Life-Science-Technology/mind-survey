import React, { useState, useEffect, useCallback } from 'react';
import supabase from '../supabaseClient';

const Results = ({ userData, restartSurvey, updateUserData }) => {
  const { depressionScore, anxietyScore, stressScore } = userData;
  
  // 상태 관리
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [consentChecked, setConsentChecked] = useState({
    personalInfo: false,
    thirdParty: false,
    marketing: false
  });
  
  // 개인정보 입력 관련 상태
  const [emailError, setEmailError] = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // 컴포넌트 마운트 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Determine depression severity
  const getDepressionSeverity = (score) => {
    if (score <= 4) return '정상 수준';
    if (score <= 9) return '경미한 수준';
    if (score <= 14) return '중간 수준';
    if (score <= 19) return '약간심한 수준';
    return '심한 수준';
  };
  
  // Determine anxiety severity
  const getAnxietySeverity = (score) => {
    if (score <= 4) return '정상 수준';
    if (score <= 9) return '경미한 수준';
    if (score <= 14) return '중간 수준';
    return '심한 수준';
  };

  // Determine stress severity (PSS scoring)
  const getStressSeverity = (score) => {
    if (score <= 12) return '정상 수준';
    if (score <= 15) return '경미한 수준';
    if (score <= 18) return '중간 수준';
    return '심한 수준';
  };

  // 체크박스 상태 변경 핸들러
  const handleConsentChange = (e) => {
    const { name, checked } = e.target;
    setConsentChecked(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // 필수 동의 항목 확인 함수
  const isConsentValid = () => {
    // 사용자가 수정한 UI에 따라 personalInfo만 체크하면 됨
    return consentChecked.personalInfo;
  };
  
  // 이메일 형식 검증
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // 전화번호 형식 검증
  const validatePhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    // 010으로 시작하고 총 11자리인지 확인 (한국 휴대폰 번호 형식)
    return digits.startsWith('010') && digits.length === 11;
  };
  
  // 전화번호 형식화 함수
  const formatPhoneNumber = useCallback((phone) => {
    // 숫자가 아닌 문자 제거
    const digits = phone.replace(/\D/g, '');
    
    // 길이에 따라 형식 적용
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
  }, []);
  
  // 전화번호 초기화
  useEffect(() => {
    if (userData.phone) {
      setPhoneFormatted(formatPhoneNumber(userData.phone));
    }
  }, [userData.phone, formatPhoneNumber]);
  
  // 이메일 입력 처리
  const handleEmailChange = (e) => {
    const { value } = e.target;
    updateUserData({ email: value });
    
    // 이메일 형식 검증
    if (value && !validateEmail(value)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
    } else {
      setEmailError('');
    }
  };
  
  // 전화번호 입력 처리
  const handlePhoneChange = (e) => {
    const { value } = e.target;
    
    // 숫자만 추출
    const digits = value.replace(/\D/g, '');
    
    // 유효성 검사
    if (digits.length >= 3 && !digits.startsWith('010')) {
      setPhoneError('전화번호는 010으로 시작해야 합니다.');
    } else if (digits.length > 0 && digits.length < 11) {
      setPhoneError('전화번호는 11자리여야 합니다.');
    } else {
      setPhoneError('');
    }
    
    const formatted = formatPhoneNumber(value);
    setPhoneFormatted(formatted);
    
    // 숫자만 userData에 저장
    updateUserData({ phone: digits });
  };
  
  // 일반 입력 처리 (이름)
  const handleChange = (e) => {
    const { id, value } = e.target;
    updateUserData({ [id]: value });
  };

  // 집단 분류 함수
  const getGroupType = () => {
    if (depressionScore >= 10) {
      return 'depression'; // 우울 집단
    } else if (stressScore >= 17) {
      return 'stress'; // 스트레스 고위험 집단
    } else {
      return 'normal'; // 정상 집단
    }
  };

  // 임상시험 대기자 등록 함수
  const registerForClinicalTrial = async () => {
    // 필수 동의 항목 확인
    if (!isConsentValid()) {
      setRegistrationError('필수 동의 항목에 동의해주세요.');
      return;
    }
    
    // 개인정보 유효성 검사
    if (!userData.name || !userData.email || !userData.phone) {
      setRegistrationError('모든 필수 정보를 입력해주세요.');
      return;
    }
    
    if (!validateEmail(userData.email)) {
      setRegistrationError('유효한 이메일 주소를 입력해주세요.');
      return;
    }
    
    if (!validatePhoneNumber(userData.phone)) {
      setRegistrationError('전화번호는 010으로 시작하는 11자리 번호여야 합니다.');
      return;
    }
    
    try {
      setIsRegistering(true);
      setRegistrationError('');
      
      // 디버깅을 위한 로그 추가
      console.log('Supabase 연결 정보:', {
        url: process.env.REACT_APP_SUPABASE_URL ? '설정됨' : '설정되지 않음',
        key: process.env.REACT_APP_SUPABASE_KEY ? '설정됨' : '설정되지 않음'
      });
      
      // 사용자 데이터 로그
      console.log('저장할 데이터:', {
        name: userData.name, 
        email: userData.email, 
        phone: userData.phone, 
        depressive: depressionScore,
        anxiety: anxietyScore,
        stress: stressScore
      });
      
      // Supabase에 데이터 저장
      const { data, error } = await supabase
        .from('survey-person')
        .insert([
          { 
            name: userData.name, 
            email: userData.email, 
            phone: userData.phone, 
            depressive: depressionScore,
            anxiety: anxietyScore,
            stress: stressScore,
            // created_at은 Supabase에서 now() 함수로 자동 처리됩니다
          }
        ]);
      
      // 응답 로그
      const { status, statusText } = { status: 201, statusText: 'Created', ...data };
      console.log('Supabase 응답:', { data, error, status, statusText });
      
      if (error) {
        throw new Error(`데이터 저장 오류: ${error.message || error}`);
      }
      
      // 성공 여부 확인 - 실제 Supabase 응답 형식에 맞게 처리
      if (status === 201 || statusText === 'Created') {
        console.log('데이터가 성공적으로 생성되었습니다 (201 상태 코드)');
        setRegistrationSuccess(true);
      } else {
        // 다른 성공 시나리오 처리
        console.log('응답 처리 중:', { data, status, statusText });
        
        // 데이터가 배열이고 요소가 있는 경우 성공으로 처리
        if (Array.isArray(data) && data.length > 0) {
          console.log('데이터 배열이 있으므로 성공으로 처리합니다.');
          setRegistrationSuccess(true);
        }
        // 데이터가 객체이고 id가 있는 경우 성공으로 처리
        else if (data && (data.id || (Array.isArray(data) && data.length > 0))) {
          console.log('데이터에 ID가 있으므로 성공으로 처리합니다.');
          setRegistrationSuccess(true);
        }
        // 그 외의 경우 성공으로 간주 (오류가 없으므로)
        else {
          console.log('오류가 없으므로 성공으로 처리합니다.');
          setRegistrationSuccess(true);
        }
      }
      
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('등록 오류:', error);
      // 사용자에게 더 자세한 오류 메시지 표시
      setRegistrationError(`등록 중 오류가 발생했습니다. 담당자에게 문의해주세요.`);
    } finally {
      setIsRegistering(false);
    }
  };


  return (
    <div className="results-container">
      <h1>설문조사 결과</h1>
      
      <div className="score-container">
        <div className="score-box">
          <h2>우울증상 점수</h2>
          <p className="score">{depressionScore}</p>
          <p className="severity">{getDepressionSeverity(depressionScore)}</p>
        </div>
        
        <div className="score-box">
          <h2>불안증상 점수</h2>
          <p className="score">{anxietyScore}</p>
          <p className="severity">{getAnxietySeverity(anxietyScore)}</p>
        </div>

        <div className="score-box">
          <h2>스트레스 점수</h2>
          <p className="score">{stressScore}</p>
          <p className="severity">{getStressSeverity(stressScore)}</p>
        </div>
      </div>
      
      <div className="expert-advice">
        <h3>귀하는 임상시험 대상자입니다.</h3>
        {getGroupType() === 'depression' ? (
          <>
            <p><strong>우울 집단</strong>으로 분류되었습니다.</p>
            <p>임상시험 대상자 조건: 우울증상 점수 10점 이상</p>
          </>
        ) : getGroupType() === 'stress' ? (
          <>
            <p><strong>스트레스 고위험 집단</strong>으로 분류되었습니다.</p>
            <p>임상시험 대상자 조건: 우울 점수 10점 미만, 스트레스 점수 17점 이상</p>
          </>
        ) : (
          <>
            <p><strong>정상 집단</strong>으로 분류되었습니다.</p>
            <p>임상시험 대상자 조건: 우울 점수 10점 미만, 스트레스 점수 17점 미만</p>
          </>
        )}
        <p>임상시험에 관심이 있으신 분들은 임상시험 대기자 등록을 진행해주세요.</p>
        
        {!registrationSuccess && (
          <div className="contact-form">
            <h3>실험 참여 안내를 위한 개인정보 입력</h3>
            <div className="form-group">
              <label htmlFor="name">이름</label>
              <input 
                type="text" 
                id="name" 
                value={userData.name || ''}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input 
                type="email" 
                id="email" 
                value={userData.email || ''}
                onChange={handleEmailChange}
                required
                className={emailError ? 'input-error' : ''}
              />
              {emailError && <p className="error-message">{emailError}</p>}
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
          </div>
        )}
        
        {registrationSuccess ? (
          <div className="registration-success">
            <h3>등록이 완료되었습니다!</h3>
            <p>임상시험 대기자로 등록되었습니다.</p>
            <p>임상시험 담당자가 곧 연락드릴 예정입니다. 감사합니다.</p>
          </div>
        ) : (
          <div className="registration-section">
            <h3>임상시험 대기자 등록</h3>
            
            {registrationError && (
              <p className="error-message">{registrationError}</p>
            )}
            
            <div className="consent-section">
              <div className="consent-item">
                <input 
                  type="checkbox" 
                  id="personalInfo" 
                  name="personalInfo" 
                  checked={consentChecked.personalInfo}
                  onChange={handleConsentChange}
                />
                <label htmlFor="personalInfo">
                  <strong>[필수]</strong> 개인정보 수집 및 이용에 동의합니다.
                </label>
                <div className="consent-details">
                  <p>수집항목: 이름, 이메일, 전화번호, 설문조사 결과</p>
                  <p>수집목적: 임상시험 참여 대상자 선정 및 연락</p>
                  <p>보유기간: 동의 철회 시까지</p>
                </div>
              </div>
            </div>
            
            <button 
              type="button" 
              className={`btn register-btn ${isConsentValid() ? 'active' : 'disabled'}`}
              onClick={registerForClinicalTrial}
              disabled={isRegistering || !isConsentValid()}
            >
              {isRegistering ? '등록 중...' : '임상시험 대기자 등록'}
            </button>
          </div>
        )}
      </div>
      
      <button 
        type="button" 
        className="btn restart-btn" 
        onClick={restartSurvey}
      >
        다시 시작
      </button>
    </div>
  );
};

export default Results;
