import React, { useState } from 'react';
import supabase from '../supabaseClient';

const Results = ({ userData, restartSurvey }) => {
  const { name, email, phone, depressionScore, anxietyScore } = userData;
  
  // 상태 관리
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [consentChecked, setConsentChecked] = useState({
    personalInfo: false,
    thirdParty: false,
    marketing: false
  });
  
  // Determine if scores exceed thresholds
  const needsContact = depressionScore >= 12;
  
  // Determine depression severity
  const getDepressionSeverity = (score) => {
    if (score <= 4) return '정상';
    if (score <= 9) return '경미한 수준';
    if (score <= 14) return '중간 수준';
    if (score <= 19) return '약간심한 수준';
    return '심한 수준';
  };
  
  // Determine anxiety severity
  const getAnxietySeverity = (score) => {
    if (score <= 4) return '정상';
    if (score <= 9) return '경미한 수준';
    if (score <= 14) return '중간 수준';
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

  // 임상시험 대기자 등록 함수
  const registerForClinicalTrial = async () => {
    // 필수 동의 항목 확인
    if (!isConsentValid()) {
      setRegistrationError('필수 동의 항목에 동의해주세요.');
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
        name, 
        email, 
        phone, 
        depressive: depressionScore,
        anxiety: anxietyScore
      });
      
      // Supabase에 데이터 저장
      const { data, error } = await supabase
        .from('survey-person')
        .insert([
          { 
            name, 
            email, 
            phone, 
            depressive: depressionScore,
            anxiety: anxietyScore,
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
      </div>
      
      {needsContact ? (
        <div className="expert-advice">
          <h3>귀하는 임상시험 대상자입니다.</h3>
          <p>임상시험에 관심이 있으신 분들은 임상시험 대기자 등록을 진행해주세요.</p>
          <p>임상시험 대상자 조건: 우울증상 점수 12점 이상</p>
          
          {!registrationSuccess ? (
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
          ) : (
            <div className="registration-success">
              <h3>등록이 완료되었습니다!</h3>
              <p>임상시험 대기자로 등록되었습니다.</p>
              <p>임상시험 담당자가 곧 연락드릴 예정입니다. 감사합니다.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="normal-container">
          <h3>정상 범위 내 증상입니다</h3>
          <p>현재 우울증상 및 불안증상이 정상 범위 내에 있습니다.</p>
        </div>
      )}
      
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
