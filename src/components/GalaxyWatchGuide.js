import React from 'react';
import { useNavigate } from 'react-router-dom';

const watchImageStyle = {
  maxWidth: '100%',
  width: '400px',
  height: 'auto',
  borderRadius: '8px'
};

const GalaxyWatchGuide = () => {
  const navigate = useNavigate();
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  return (
    <div className="data-collection-guide">
      <div className="guide-header">
        <h1>갤럭시 워치 전원 관리 안내</h1>
      </div>
      
      <div className="guide-content">
        <div className="guide-section">
          <h2>■ 전원 켜고 끄는 법</h2>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <img 
              src="galaxy_watch_power/galaxy_watch_power_1.png" 
              alt="갤럭시 워치 전원 켜기" 
              style={watchImageStyle}
            />
          </div>
          
          <h3>1. 전원 켜는 법</h3>
          <ul>
            <li>홈 버튼을 길게 누르면 전원이 켜집니다.</li>
          </ul>
          
          <h3>2. 전원 끄는 법</h3>
          <ul>
            <li>홈 버튼과 뒤로가기 버튼을 동시에 길게 눌러 
              <img 
                src="galaxy_watch_power/galaxy_watch_power_button.png" 
                alt="전원 버튼" 
                style={{ width: '30px', height: '30px', margin: '0 0px', verticalAlign: 'middle' }}
              /> 
              버튼을 클릭하면 전원이 꺼집니다.
            </li>
          </ul>
        </div>

        <div className="guide-section">
          <h2>■ 화면 켜고 끄는 법</h2>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <img 
              src="galaxy_watch_power/galaxy_watch_power_2.png" 
              alt="갤럭시 워치 화면 제어" 
              style={watchImageStyle}
            />
          </div>
          
          <h3>1. 화면 켜는 법</h3>
          <ul>
            <li>홈 버튼이나 뒤로 가기 버튼을 누르면 화면이 켜집니다.</li>
            <li>화면을 짧게 터치하거나 손목을 올리면 켜집니다.</li>
          </ul>
          
          <h3>2. 화면 끄는 법</h3>
          <ul>
            <li>손바닥으로 화면을 덮으면 꺼집니다.</li>
            <li>일정 시간동안 사용하지 않으면 자동으로 화면이 꺼집니다.</li>
          </ul>
        </div>
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

export default GalaxyWatchGuide;