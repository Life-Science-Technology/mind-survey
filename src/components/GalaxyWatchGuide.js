import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

const watchImageStyle = {
  maxWidth: '100%',
  width: '300px',
  height: 'auto',
  borderRadius: '8px'
};

const squareImageStyle = {
  maxWidth: '100%',
  aspectRatio: '1 / 1',
  objectFit: 'contain',
  borderRadius: '8px'
};

const GalaxyWatchGuide = () => {
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState('basic-usage');
  const [activeSubTab, setActiveSubTab] = useState('power');
  
  const handleBackClick = () => {
    navigate(-1);
  };

  const handleMainTabChange = (selectedOption) => {
    const tabId = selectedOption.value;
    // 같은 탭을 선택한 경우 서브탭 변경 없이 리턴
    if (tabId === activeMainTab) {
      return;
    }
    
    setActiveMainTab(tabId);
    // 기본 사용법 탭으로 이동 시 서브 탭을 전원으로 초기화
    if (tabId === 'basic-usage') {
      setActiveSubTab('power');
    }
    // 탭 변경 시 페이지 최상단으로 스크롤
    window.scrollTo(0, 0);
  };

  const handleSubTabChange = (tabId) => {
    setActiveSubTab(tabId);
    // 탭 변경 시 페이지 최상단으로 스크롤
    window.scrollTo(0, 0);
  };

  const mainTabOptions = [
    { value: 'basic-usage', label: '갤럭시워치 기본 사용법' },
    { value: 'pairing', label: '갤럭시 워치와 스마트폰 페어링 하는 법' }
  ];

  const subTabs = [
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
        <h1>실증 실험 안내</h1>
        
        {/* 메인 탭 네비게이션 - React Select */}
        <div className="main-tab-navigation" style={{ marginTop: '20px' }}>
          <Select
            value={mainTabOptions.find(option => option.value === activeMainTab)}
            onChange={handleMainTabChange}
            options={mainTabOptions}
            placeholder="안내 내용을 선택하세요"
            isSearchable={false}
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: '45px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                boxShadow: 'none',
                '&:hover': {
                  border: '2px solid #007bff'
                }
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
                color: state.isSelected ? 'white' : '#333',
                padding: '12px 16px',
                fontSize: '16px'
              }),
              singleValue: (provided) => ({
                ...provided,
                color: '#333',
                fontWeight: '500'
              })
            }}
          />
        </div>

        {/* 서브 탭 네비게이션 (기본 사용법 선택 시에만 표시) */}
        {activeMainTab === 'basic-usage' && (
          <div className="sub-tab-navigation" style={{ marginTop: '15px' }}>
            {subTabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeSubTab === tab.id ? 'active' : ''}`}
                onClick={() => handleSubTabChange(tab.id)}
                style={{
                  padding: '8px 16px',
                  margin: '0 3px',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: activeSubTab === tab.id ? '#007bff' : '#e9ecef',
                  color: activeSubTab === tab.id ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeSubTab === tab.id ? 'bold' : 'normal'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="guide-content">
        {/* 페어링 탭 */}
        {activeMainTab === 'pairing' && (
          <div className="guide-section">
            <h2>■ 갤럭시 워치와 스마트폰 페어링 하는 법</h2>
            
            <div className="guide-subsection">
              <h3>1. 상단 메뉴 혹은 설정에서 Bluetooth 켠 후 앱 목록에서 Galaxy Wearable 찾아 실행</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair-1.png" 
                  alt="삼성 스마트폰 홈화면에서 Galaxy Wearable 찾기" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>2. 자동 연결 혹은 기기 선택에서 스마트워치 선택</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair_2.png" 
                  alt="Watch6 워치에 연결중 화면" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>3. 확인 클릭</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair-3.png" 
                  alt="워치에 표시된 숫자가 일치하는지 확인하세요" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '65%',
                    display: 'inline-block',
                    marginRight: '5px',
                    verticalAlign: 'middle'
                  }}
                />
                <img 
                  src="galaxy_pair/galaxy_pair_number.png" 
                  alt="워치 화면에서 시작중..." 
                  style={{
                    ...squareImageStyle,
                    width: window.innerWidth > 768 ? '200px' : '45%',
                    display: 'inline-block',
                    marginLeft: '5px',
                    verticalAlign: 'middle'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>4. 모두 동의 클릭 후 계속</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair-4.png" 
                  alt="아래 항목에 동의하고 계속 진행" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>5. Google 계정 로그인(위와 같은 화면이 뜰 경우 다시 시도 클릭)</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair_2-1.png" 
                  alt="Google 계정을 복사할 수 없습니다" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>6. 동의 클릭</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair_2-2.png" 
                  alt="서비스 약관 동의" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>7. 다음 클릭</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair_2-3.png" 
                  alt="워치 데이터 자동 백업" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>8. 모두 허용 클릭</h3>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: window.innerWidth > 768 ? 'repeat(4, 1fr)' : window.innerWidth > 480 ? 'repeat(2, 1fr)' : '1fr',
                gap: '15px',
                margin: '20px 0',
                justifyItems: 'center'
              }}>
                <img 
                  src="galaxy_pair/galaxy_pair_2-4.png" 
                  alt="삼성 Smart Switch - 데이터 전송하기" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '200px' : '80%'
                  }}
                />
                <img 
                  src="galaxy_pair/galaxy_pair_2-5.png" 
                  alt="삼성 Smart Switch의 필요한 사용을 위한 접근 권한 안내" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '200px' : '80%'
                  }}
                />
                <img 
                  src="galaxy_pair/galaxy_pair_2-6.png" 
                  alt="백터리 사용량 최적화 동의" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '200px' : '80%'
                  }}
                />
                <img 
                  src="galaxy_pair/galaxy_pair_2-7.png" 
                  alt="워치의 Smart Switch 사용 권한" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '200px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>9. 허용 클릭</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair_3-1.png" 
                  alt="워치의 Smart Switch 사용 권한" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>10. 개인 설정 후 다음 클릭</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair_3-2.png" 
                  alt="워치를 착용할 손목 설정" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>11. 동의 클릭</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair_3-3.png" 
                  alt="사전 설치된 워치 앱에서 필요한 권한" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>

            <div className="guide-subsection">
              <h3>12. 페어링 완료!</h3>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src="galaxy_pair/galaxy_pair_3-4.png" 
                  alt="완료 중... 페어링 완료" 
                  style={{
                    ...watchImageStyle,
                    width: window.innerWidth > 768 ? '300px' : '80%'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 기본 사용법 탭 */}
        {activeMainTab === 'basic-usage' && (
          <>
            {/* 전원 관리 서브탭 */}
            {activeSubTab === 'power' && (
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

            {/* 화면 좌우상하 서브탭 */}
            {activeSubTab === 'basic' && (
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