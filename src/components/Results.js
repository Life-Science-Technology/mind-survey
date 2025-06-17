import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Results = ({ userData, restartSurvey, updateUserData }) => {
  const { depressionScore, anxietyScore, stressScore } = userData;
  const navigate = useNavigate();
  

  
  // 컴포넌트 마운트 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Determine depression severity
  const getDepressionSeverity = (score) => {
    if (score <= 4) return '정상 수준';
    if (score <= 9) return '가벼운 우울';
    if (score <= 14) return '중간 우울';
    if (score <= 19) return '중간 우울';
    return '심한 우울';
  };
  
  // Determine anxiety severity
  const getAnxietySeverity = (score) => {
    if (score <= 4) return '정상 수준';
    if (score <= 9) return '경미한 수준';
    if (score <= 14) return '중간 수준';
    return '심한 수준';
  };

  // Determine stress severity (PSS scoring)
  const getStressSeverity = (score) => {
    if (score <= 12) return '정상 수준';
    if (score <= 15) return '경미한 수준';
    if (score <= 18) return '중간 수준';
    return '심한 수준';
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

  // 데이터 수집 참여 안내 페이지로 이동
  const handleDataCollectionGuide = () => {
    navigate('/data-collection-guide', {
      state: {
        depressionScore,
        anxietyScore,
        stressScore,
        userData
      }
    });
  };




  return (
    <div className="results-container">
      <h1>설문(테스트) 결과</h1>
      
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

        <div className="score-box">
          <h2>스트레스 점수</h2>
          <p className="score">{stressScore}</p>
          <p className="severity">{getStressSeverity(stressScore)}</p>
        </div>
      </div>
      
      {/* 점수 해석 표 */}
      
      <div className="test-info">
        <p>테스트 결과 귀하는 <span className="experiment-eligible"><strong>
          {getGroupType() === 'depression' ? '우울군' : 
          getGroupType() === 'stress' ? '스트레스 고위험군' : '건강인'}</strong> 으로 실험 참여가 가능</span>합니다.</p>
      </div>

      <div className="data-collection-info">
        <button 
          type="button" 
          className="btn data-collection-btn"
          onClick={handleDataCollectionGuide}
        >
          실험 참여 안내
        </button>
      </div>

      <div className="score-interpretation">
        <h2>우울 점수 해석 (PHQ-9)</h2>
        <table className="interpretation-table">
          <thead>
            <tr>
              <th>점수</th>
              <th>분류</th>
              <th>해석</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0-4</td>
              <td>정상 수준</td>
              <td>의미있는 우울감 아님</td>
            </tr>
            <tr>
              <td>5-9</td>
              <td>가벼운 우울</td>
              <td>경미한 수준의 우울감이 존재하나, 일상에 지장을 줄 정도는 아님.<br/>현 상황이 지속된다면 개인 생활에 영향을 줄 수도 있음</td>
            </tr>
            <tr>
              <td>10-19</td>
              <td>중간 우울</td>
              <td>중간 수준의 우울감. 일상에 지장을 줄 수 있으므로 전문 기관 방문을 권장함</td>
            </tr>
            <tr>
              <td>20-27</td>
              <td>심한 우울</td>
              <td>심한 수준의 우울감. 전문 기관의 치료적 개입이 필요함</td>
            </tr>
          </tbody>
        </table>

        <h2>불안 점수 해석 (GAD-7)</h2>
        <table className="interpretation-table">
          <thead>
            <tr>
              <th>점수</th>
              <th>분류</th>
              <th>해석</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0-4</td>
              <td>정상 수준</td>
              <td>주의가 필요한 수준은 아님</td>
            </tr>
            <tr>
              <td>5-9</td>
              <td>가벼운 수준</td>
              <td>경미한 수준의 걱정과 불안으로 주의깊은 관찰과 관심이 요구됨</td>
            </tr>
            <tr>
              <td>10-14</td>
              <td>중간 수준</td>
              <td>주의가 필요한 수준의 과도한 걱정과 불안으로 추가적 검사나 전문 기관 방문을 권장함</td>
            </tr>
            <tr>
              <td>15-21</td>
              <td>심한 수준</td>
              <td>일상생활에 지장을 초래할 정도의 과도하고 심한 걱정과 불안으로 추가적 검사나 전문 기관의 개입을 권장함</td>
            </tr>
          </tbody>
        </table>

        <h2>스트레스 점수 해석</h2>
        <table className="interpretation-table">
          <thead>
            <tr>
              <th>점수</th>
              <th>분류</th>
              <th>해석</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0-13</td>
              <td>정상 수준</td>
              <td>정상적인 수준으로 심리적으로 안정되어 있음</td>
            </tr>
            <tr>
              <td>14-16</td>
              <td>가벼운 수준</td>
              <td>약간의 스트레스를 받고 있으며, 스트레스 해소를 위한 운동, 산책, 명상 등의 방법을 권장함</td>
            </tr>
            <tr>
              <td>17-18</td>
              <td>중간 수준</td>
              <td>중간 정도의 스트레스를 받고 있으며, 스트레스 해소를 위한 전문 기관을 찾는 등 적극적인 노력이 필요함</td>
            </tr>
            <tr>
              <td>19점 이상</td>
              <td>심한 수준</td>
              <td>심한 스트레스를 받는 것으로 나타나 일상 생활에서 어려움을 겪을 가능성이 보임.<br/>추가적인 검사나 전문 기관 방문을 권장함</td>
            </tr>
          </tbody>
        </table>
      </div>
      

      
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
