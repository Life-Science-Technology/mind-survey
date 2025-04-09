import React from 'react';

const IntroPage = ({ nextPage }) => {
  return (
    <div className="intro-container">
      <h1>설문조사</h1>
      
      <div className="intro-content">
        <p>이 웹사이트는 임상시험 대상자 선별을 위해 우울증상, 불안증상 설문조사를 진행합니다.</p>
      </div>
      
      <button 
        type="button" 
        className="btn start-btn" 
        onClick={nextPage}
      >
        시작하기
      </button>
    </div>
  );
};

export default IntroPage;
