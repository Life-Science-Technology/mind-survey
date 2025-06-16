import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../supabaseClient';

const DataCollectionGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 전달받은 점수 데이터
  const { depressionScore = 0, anxietyScore = 0, stressScore = 0, userData: initialUserData = {} } = location.state || {};
  
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
  const [userData, setUserData] = useState(initialUserData);
  const [emailError, setEmailError] = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleBackClick = () => {
    navigate(-1); // 이전 페이지로 돌아가기
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
    return digits.startsWith('010') && digits.length === 11;
  };
  
  // 전화번호 형식화 함수
  const formatPhoneNumber = useCallback((phone) => {
    const digits = phone.replace(/\D/g, '');
    
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
  
  // 사용자 데이터 업데이트 함수
  const updateUserData = (newData) => {
    setUserData(prevData => ({
      ...prevData,
      ...newData
    }));
  };
  
  // 이메일 입력 처리
  const handleEmailChange = (e) => {
    const { value } = e.target;
    updateUserData({ email: value });
    
    if (value && !validateEmail(value)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
    } else {
      setEmailError('');
    }
  };
  
  // 전화번호 입력 처리
  const handlePhoneChange = (e) => {
    const { value } = e.target;
    const digits = value.replace(/\D/g, '');
    
    if (digits.length >= 3 && !digits.startsWith('010')) {
      setPhoneError('전화번호는 010으로 시작해야 합니다.');
    } else if (digits.length > 0 && digits.length < 11) {
      setPhoneError('전화번호는 11자리여야 합니다.');
    } else {
      setPhoneError('');
    }
    
    const formatted = formatPhoneNumber(value);
    setPhoneFormatted(formatted);
    updateUserData({ phone: digits });
  };
  
  // 일반 입력 처리 (이름)
  const handleChange = (e) => {
    const { id, value } = e.target;
    updateUserData({ [id]: value });
  };

  // 임상시험 대기자 등록 함수
  const registerForClinicalTrial = async () => {
    if (!isConsentValid()) {
      setRegistrationError('필수 동의 항목에 동의해주세요.');
      return;
    }
    
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
      
      const { error } = await supabase
        .from('survey-person')
        .insert([
          { 
            name: userData.name, 
            email: userData.email, 
            phone: userData.phone, 
            depressive: depressionScore,
            anxiety: anxietyScore,
            stress: stressScore,
          }
        ]);
      
      if (error) {
        throw new Error(`데이터 저장 오류: ${error.message || error}`);
      }
      
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('등록 오류:', error);
      setRegistrationError(`등록 중 오류가 발생했습니다. 담당자에게 문의해주세요.`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="data-collection-guide">
      <div className="guide-header">
        <h1>웨어러블 기반 라이프로그 데이터 수집 참여 안내</h1>
      </div>
      
      <div className="guide-content">
        <div className="guide-intro">
          <p>
          한국과학기술연구원 바이오닉스 연구센터에서는 경찰 맞춤형 스트레스 관리 모니터링 시스템을 개발하기 위해 다음과 같이 3주간 생체 신호 및 라이프로그 데이터 수집에 참여할 참여자를 모집합니다. 
          </p>
        </div>

        <div className="guide-section">
          <h2>■ 참여 대상</h2>
          <ul>
            <li>근속 1년 이상 경찰</li>
            <li>삼성 갤럭시 핸드폰 사용자 (아이폰은 정책상 연구에 필요한 데이터를 제공받지 못합니다)</li>
            <li>정신 건강 검사 결과 실험 참여군에 속하는 분</li>
          </ul>
        </div>

        <div className="guide-section">
          <h2>■ 모집 개요</h2>
          <ul>
            <li>모집 기간: <strong>25.6.23 (월) – 충원시까지</strong></li>
            <li>모집 인원: <strong>우울군 50명, 스트레스 고위험군 25명, 건강군 25명</strong></li>
            <li>실험 기간: <strong>25.7.14 – 25.9.28 (워치 측정 시작한 날로부터 3주간)</strong></li>
          </ul>
        </div>

        <div className="guide-section">
          <h2>■ 참여 내용 및 과정</h2>
          <ol>
            <li>해당 실험군으로 실험 참여를 원하시면 <strong>'대기자 등록'을 위해 이름, 연락처를 기입</strong>해 주세요.</li>
            <li>연구실에서 <strong>개별적으로 연락</strong>을 드리고 제공해 주신 정보에 따라 <strong>갤럭시 워치를 배송</strong>합니다 (개인 소유 
                워치가 있는 경우에도 참여 가능합니다.)</li>
            <li>보내드리는 링크를 통해, 인구학적 정보, 직무 형태, 직무 스트레스, 개인 성향 등 <strong>설문</strong>을 진행해 주세요.</li>
            <li>갤럭시 워치를 배송받은 후, <strong>핸드폰과 연동</strong>해 주세요.</li>
            <li>구글 플레이 스토어에서 <strong>워치용 앱(KIST 건강 모니터링)을 다운로드하여 설치해 주세요</strong>. (개인소유 갤럭시 
                워치도 동일한 절차를 따릅니다)</li>
            <li><strong>삼성 헬스 데이터 수집에 동의</strong>하고 연동해 주세요. (운동량 및 수면 정보 취득 목적)</li>
            <li>설치된 앱을 통해 <strong>2시간 마다 자동으로 귀하의 맥파 정보를 취득하여 스트레스 정도를 알려줍니다.</strong> 알림
            을 받으면, <strong>해당 스트레스 정보가 맞는지, 실제 스트레스 정도는 어느 정도인지 피드백</strong>을 주시면 됩니다.</li>
            <li>알림은 <strong>근무 시간 중심으로 6회</strong> 정도 제공되며, 스트레스에 따라 수동적으로 입력 가능합니다.</li>
            <li>주간 근무 및 휴일에는 8:00 - 20:00, 야간 근무에는 20:00 - 8:00시 기준으로 알림이 제공됩니다.</li>
            <li>하루 1회(20:00시) <strong>1분간 걷는 상태에서의 데이터 측정</strong> 과정이 있습니다.</li>
            <li>충전 시간 외에는 <strong>상시 워치를 착용</strong>해주십시오.</li>
            <li>정신 건강 정도를 확인하기 위해 <strong>주 1회 간단한 온라인 설문</strong>을 진행해 주십시오(1분 미만).</li>
            <li>실험 완료 후 워치 반납을 위한 방문 수거(택배) 안내를 드립니다.</li>
          </ol>
        </div>

        <div className="guide-section">
          <h2>■ 참여 혜택</h2>
          <p>본 실증 실험 데이터 수집이 완료된 분께는 참여사례비(100,000원)가 지급됩니다.</p>
        </div>

        <div className="guide-section">
          <h2>■ 문의 사항</h2>
          <p>본 실험 과정에 대한 문의는 오픈 카카오톡으로 하실 수 있습니다
            (<a href="https://open.kakao.com/o/gTH3TfCg" target="_blank" rel="noopener noreferrer">
                https://open.kakao.com/o/gTH3TfCg
            </a>, 'Police stress monitoring’으로 검색)</p>
        </div>

        {/* 실증 참여 섹션 - 점수가 있는 경우에만 표시 */}
        {(depressionScore > 0 || anxietyScore > 0 || stressScore > 0) && (
          <div className="guide-section">
            <h2>■ 실증 참여</h2>
            <p>귀하는 <strong>
              {getGroupType() === 'depression' ? '우울군' : 
              getGroupType() === 'stress' ? '스트레스 고위험군' : '건강군'}</strong>으로 분류되어 실증 실험 참여가 가능합니다.</p>
            <p>실증 실험에 참여를 원하시면 개별 연락을 위해 대기자 등록을 진행해 주시기 바랍니다.</p>
            
            <div className="registration-form-container">
              <h4>■ 실증 실험 대기자 등록</h4>
              
              {registrationSuccess ? (
                <div className="registration-success-box">
                  <p><strong>등록이 완료되었습니다!</strong></p>
                  <p>실증 실험 대기자로 등록되었습니다.</p>
                  <p>담당자가 곧 연락드릴 예정입니다. 감사합니다.</p>
                </div>
              ) : (
                <div className="registration-form-box">
                  <div className="form-section">
                    <h5>개인정보 입력</h5>
                    <div className="form-group">
                      <label htmlFor="name"><strong>이름</strong></label>
                      <input 
                        type="text" 
                        id="name" 
                        value={userData.name || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email"><strong>이메일</strong></label>
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
                      <label htmlFor="phone"><strong>전화번호</strong></label>
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

                  <div className="consent-section">
                    {registrationError && (
                      <p className="error-message">{registrationError}</p>
                    )}
                    
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
                        <ul>
                          <li>개인 정보 수집 항목: 이름, 성별, 휴대폰 번호, 이메일 주소, 테스트 결과</li>
                          <li>수집 목적: 실험 참여 의사를 밝힌 분의 본인 확인 및 실험 방법 안내</li>
                          <li>보유기간: 동의 철회 시까지</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="submit-section">
                    <button 
                      type="button" 
                      className={`btn register-btn ${isConsentValid() ? 'active' : 'disabled'}`}
                      onClick={registerForClinicalTrial}
                      disabled={isRegistering || !isConsentValid()}
                    >
                      {isRegistering ? '등록 중...' : '실증 실험 대기자 등록'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="guide-actions">
        <button 
          className="btn back-btn"
          onClick={handleBackClick}
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default DataCollectionGuide; 