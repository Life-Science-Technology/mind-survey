import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DataCollectionGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 전달받은 점수 데이터
  const { depressionScore = 0, anxietyScore = 0, stressScore = 0 } = location.state || {};

  const handleBackClick = () => {
    navigate(-1);
  };

  // 등록 페이지로 이동 핸들러
  const handleRegistrationClick = () => {
    navigate('/registration', {
      state: {
        depressionScore,
        anxietyScore,
        stressScore
      }
    });
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
            <li>모집 인원: <strong>우울군 50명, 스트레스 고위험군 25명, 건강인 25명</strong></li>
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

        {/* 실증 참여 섹션 - 항상 표시 */}
        <div className="guide-section">
          <h2>■ 실증 참여</h2>
          <p>귀하는 <strong>
            {getGroupType() === 'depression' ? '우울군' : 
            getGroupType() === 'stress' ? '스트레스 고위험군' : '건강인'}</strong>으로 분류되어 실증 실험 참여가 가능합니다.</p>
          <p>실증 실험에 참여를 원하시면 개별 연락을 위해 대기자 등록을 진행해 주시기 바랍니다.</p>

          {/* 실증 실험 대기자 등록 섹션 */}
          <div className="registration-form-container">
            <h4>■ 실증 실험 대기자 등록</h4>
            
            <div className="registration-button-container">
              <p>실증 실험 대기자 등록을 위해 개인정보 입력과 동의서 작성이 필요합니다.</p>
              <p>아래 버튼을 클릭하여 등록 절차를 진행해 주세요.</p>
              <button 
                type="button" 
                className="btn register-btn"
                onClick={handleRegistrationClick}
              >
                실증 실험 대기자 등록하기
              </button>
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

export default DataCollectionGuide; 