import React from 'react';
import { useNavigate } from 'react-router-dom';

// 상수 정의
const SURVEY_ROUTE = '/survey';
const ALERT_MESSAGE = '실증 실험 안내 페이지는 준비 중입니다.';

const HomePage = () => {
  const navigate = useNavigate();

  // 설문조사 페이지 이동 핸들러
  const handleSurveyClick = () => {
    try {
      navigate(SURVEY_ROUTE);
    } catch (error) {
      console.error('설문조사 페이지 이동 중 오류 발생:', error);
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
      <header className="home-header">
        <h1>[경찰 건강 스마트 관리 R&amp;D]</h1>
      </header>
      
      <div className="home-title">
        <h2>[경찰 맞춤형 스트레스 관리 모니터링 시스템 실증 실험 안내]</h2>
      </div>

      <main className="home-content">
        <div className="description">
          <p>(워드 파일을 참고로 현재 실문 페이지가 없다)</p>
          <p className="simple-description">(간단한 페이지 설명 필요)</p>
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
              <h3>실증 실험 참여를 위한 정신</h3>
              <h3>건강 설문</h3>
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
              <h3>실증 실험 안내</h3>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage; 