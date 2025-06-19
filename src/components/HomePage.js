import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 상수 정의
const SURVEY_ROUTE = '/survey';
const REGISTRATION_ROUTE = '/registration';
const ALERT_MESSAGE = '실증 실험 안내 페이지는 준비 중입니다.';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');

  // 대기자 등록 성공 메시지 확인
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // 5초 후 메시지 자동 제거
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // 설문조사 페이지 이동 핸들러
  const handleSurveyClick = () => {
    try {
      navigate(SURVEY_ROUTE);
    } catch (error) {
      console.error('설문조사 페이지 이동 중 오류 발생:', error);
      alert('페이지 이동 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 대기자 동의서 제출 클릭 핸들러
  const handleRegistrationClick = () => {
    try {
      navigate(REGISTRATION_ROUTE);
    } catch (error) {
      console.error('대기자 동의서 제출 페이지 이동 중 오류 발생:', error);
      alert('페이지 이동 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 실증 실험 안내 클릭 핸들러
  const handleGuideClick = () => {
    alert(ALERT_MESSAGE);
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event, handler) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler();
    }
  };

  return (
    <div className="home-container">
      <div className="logo-section">
        <div className="logo-container">
          <img 
            src={`${process.env.PUBLIC_URL}/police_logo.png`}
            alt="경찰청 로고" 
            className="logo police-logo"
            onError={(e) => {
              e.target.style.display = 'none';
              console.log('경찰청 로고를 불러올 수 없습니다.');
            }}
          />
          <img 
            src={`${process.env.PUBLIC_URL}/kist_logo.png`}
            alt="한국과학기술연구원 로고" 
            className="logo kist-logo"
            onError={(e) => {
              e.target.style.display = 'none';
              console.log('KIST 로고를 불러올 수 없습니다.');
            }}
          />
        </div>
      </div>
      
      <header className="home-header">
        <h1>[경찰 건강 스마트 관리 R&amp;D]</h1>
      </header>
      
      <div className="home-title">
        <h2>[경찰 맞춤형 스트레스 관리 모니터링 시스템 실증 실험 안내]</h2>
      </div>

      <main className="home-content">
        {successMessage && (
          <div className="success-notification">
            <p className="success-text">✅ {successMessage}</p>
          </div>
        )}
        
        <div className="description">
          <div className="description-box">
            <p className="description-text">
              2025년도 경찰 스트레스 관리 모니터링 시스템 실증 실험에 참여해 주셔서 감사합니다.
            </p>
            <p className="description-text">
              실증 실험 <span className="highlight-teal">참여 대상자 등록</span>을 위해서는 아래 <span className="highlight-teal">정신 건강 설문</span> 에 먼저 응해 주시고,
            </p>
            <p className="description-text">
              실험 <span className="highlight-pink">참여자로 확인</span>되신 분들은 아래 <span className="highlight-pink">실증 실험 안내</span>를 통해 실험 내용을 확인해 주세요.
            </p>
          </div>
        </div>

        <div className="action-buttons">
          <div 
            className="action-card" 
            onClick={handleSurveyClick}
            onKeyDown={(e) => handleKeyDown(e, handleSurveyClick)}
            role="button"
            tabIndex={0}
            aria-label="실증 실험 참여를 위한 정신 건강 설문 시작하기"
          >
            <div className="card-content">
              <p className="card-subtitle">실증 실험 참여를 위한</p>
              <h3 className="card-title">정신 건강 설문</h3>
            </div>
          </div>

          <div 
            className="action-card" 
            onClick={handleRegistrationClick}
            onKeyDown={(e) => handleKeyDown(e, handleRegistrationClick)}
            role="button"
            tabIndex={0}
            aria-label="실증 실험 대기자 동의서 제출"
          >
            <div className="card-content">
              <p className="card-subtitle">참여 대상자</p>
              <h3 className="card-title">대기자 동의서 제출</h3>
            </div>
          </div>

          <div 
            className="action-card" 
            onClick={handleGuideClick}
            onKeyDown={(e) => handleKeyDown(e, handleGuideClick)}
            role="button"
            tabIndex={0}
            aria-label="실증 실험 안내 페이지 (준비 중)"
          >
            <div className="card-content">
              <h3 className="card-title">실증 실험 안내</h3>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage; 