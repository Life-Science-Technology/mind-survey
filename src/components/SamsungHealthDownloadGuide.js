import React from 'react';
import { useNavigate } from 'react-router-dom';

const getImageUrl = (imagePath) => `${process.env.PUBLIC_URL}/${imagePath}`;

const phoneImageStyle = {
  maxWidth: '100%',
  width: '300px',
  height: 'auto',
  borderRadius: '8px'
};

const SamsungHealthDownloadGuide = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };
  
  return (
    <div className="data-collection-guide">
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
        <h1>삼성 헬스 데이터 다운로드 및 전송 방법</h1>
      </div>
      
      <div className="guide-content">
        <div className="guide-section">
          <h2>■ 삼성 헬스 데이터 다운로드 방법</h2>
          
          <div className="guide-subsection">
            <h3>1. 삼성 헬스 앱 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_1/samsung_health_download_1-2.png')}
                alt="삼성 헬스 앱 아이콘 클릭" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>2. 메뉴 버튼 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_1/samsung_health_download_1-3.png')}
                alt="삼성 헬스 메인 화면" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>3. 설정 버튼 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_1/samsung_health_download_1-1.png')}
                alt="우측 상단 메뉴 버튼 클릭" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>4. 하단 부분에 개인 데이터 다운로드 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_1/samsung_health_download_1-4.png')}
                alt="설정 메뉴 클릭" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>5. 다운로드 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_1/samsung_health_download_1-5.png')}
                alt="개인 데이터 다운로드 메뉴" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>6. 액세스 팝업 허용 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_2/samsung_health_download_2-1.png')}
                alt="앱 접근 허용" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>7. 다운로드 중</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_2/samsung_health_download_2-2.png')}
                alt="허용 안함 선택" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>8. 다운 완료 후 파일보기 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_2/samsung_health_download_2-3.png')}
                alt="개인 데이터 다운로드 클릭" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>9. 좌측 상단 뒤로가기 버튼 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_2/samsung_health_download_2-4.png')}
                alt="다운로드 버튼 클릭" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>10. 파일 꾹 눌러 선택</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_2/samsung_health_download_2-5.png')}
                alt="압축 진행 중" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>11. 더보기 클릭 후 압축 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_3/samsung_health_download_3-1.png')}
                alt="액세스 팝업 허용" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>12. 압축 버튼 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_3/samsung_health_download_3-2.png')}
                alt="다운로드 진행 중" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>13. 폴더 압축 중</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_3/samsung_health_download_3-3.png')}
                alt="폴더 압축 중" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>14. 압축 완료 후 공유 클릭</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_3/samsung_health_download_3-4.png')}
                alt="위로 가기 버튼 클릭" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>

          <div className="guide-subsection">
            <h3>15. dw2@kist.re.kr로 전송</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '20px 0'
            }}>
              <img 
                src={getImageUrl('samsung_health_download/samsung_health_download_3/samsung_health_download_3-5.png')}
                alt="파일 선택하기" 
                style={{
                  ...phoneImageStyle,
                  width: window.innerWidth > 768 ? '300px' : '80%'
                }}
              />
            </div>
          </div>
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

export default SamsungHealthDownloadGuide;