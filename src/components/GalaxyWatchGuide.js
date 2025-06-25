import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const watchImageStyle = {
  maxWidth: '100%',
  width: '400px',
  height: 'auto',
  borderRadius: '8px'
};

const GalaxyWatchGuide = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('power');
  
  const handleBackClick = () => {
    navigate(-1);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // 탭 변경 시 페이지 최상단으로 스크롤
    window.scrollTo(0, 0);
  };

  const tabs = [
    { id: 'power', label: '전원 켜고 끄는 법' },
    { id: 'basic', label: '화면 좌우상하 의미' }
  ];
  
  return (
    <div className="data-collection-guide">
      {/* 고정 헤더 영역 */}
      <div 
        className="guide-header" 
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 100,
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '10px'
        }}
      >
        <h1>갤럭시 워치와 스마트폰 페어링 하는 법</h1>
        
        {/* 탭 네비게이션 */}
        <div className="tab-navigation" style={{ marginTop: '20px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '10px 20px',
                margin: '0 5px',
                border: 'none',
                borderRadius: '5px',
                backgroundColor: activeTab === tab.id ? '#007bff' : '#f8f9fa',
                color: activeTab === tab.id ? 'white' : '#333',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="guide-content">
        {/* 전원 관리 탭 */}
        {activeTab === 'power' && (
          <>
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
          </>
        )}

        {/* 화면 최우상하 탭 */}
        {activeTab === 'basic' && (
          <>
            <div className="guide-section">
              <h2>■ 화면 좌우상하 의미</h2>
              
              <div className="guide-subsection">
                <h3>1. 화면을 왼쪽으로 밀면</h3>
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <img 
                    src="galaxy_watch_basic/galaxywatch_basic_1.png" 
                    alt="갤럭시 워치 활동 링" 
                    style={watchImageStyle}
                  />
                </div>
                <ul>
                  <li>타일들이 있어 개인 건강 기능등 확인할 수 있습니다.</li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h3>2. 화면을 오른쪽으로 밀면</h3>
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <img 
                    src="galaxy_watch_basic/galaxywatch_basic_2.png" 
                    alt="갤럭시 워치 알림" 
                    style={watchImageStyle}
                  />
                </div>
                <ul>
                  <li>알림을 확인할 수 있습니다.</li>
                  <li><span style={{color: 'red'}}>스트레스 점수 선택을 놓친 경우 알람을 눌러 점수를 다시 선택할 수 있습니다.</span></li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h3>3. 화면을 아래로 밀면</h3>
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <img 
                    src="galaxy_watch_basic/galaxywatch_basic_3.png" 
                    alt="갤럭시 워치 빠른 설정" 
                    style={watchImageStyle}
                  />
                </div>
                <ul>
                  <li>빠른 설정창을 볼 수 있습니다.</li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h3>4. 화면을 위로 밀면</h3>
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <img 
                    src="galaxy_watch_basic/galaxywatch_basic_4.png" 
                    alt="갤럭시 워치 앱 메뉴" 
                    style={watchImageStyle}
                  />
                </div>
                <ul>
                  <li>앱을 확인할 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </>
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

export default GalaxyWatchGuide;