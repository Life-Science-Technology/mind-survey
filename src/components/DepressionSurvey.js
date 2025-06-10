import React, { useState } from 'react';

const DepressionSurvey = ({ updateUserData, nextPage, prevPage }) => {
  // Initialize all question responses to null
  const [responses, setResponses] = useState({
    dep1: null, dep2: null, dep3: null, dep4: null, dep5: null,
    dep6: null, dep7: null, dep8: null, dep9: null
  });

  // Questions for the depression survey
  const questions = [
    { id: 'dep1', text: '일 또는 여가 활동을 하는데 흥미나 즐거움을 느끼지 못함' },
    { id: 'dep2', text: '기분이 가라앉거나 우울하거나 희망이 없음' },
    { id: 'dep3', text: '잠이 들거나 계속 잠을 자는 것이 어려움. 또는 잠을 너무 많이 잠' },
    { id: 'dep4', text: '피곤하다고 느끼거나 기운이 거의 없음' },
    { id: 'dep5', text: '입맛이 없거나 과식을 함' },
    { id: 'dep6', text: '자신을 부정적으로 봄 – 혹은 자신이 실패자라고 느끼거나 자신 또는 가족을 실망시킴' },
    { id: 'dep7', text: '신문을 읽거나 텔레비전 보는 것과 같은 일에 집중하는 것이 어려움' },
    { id: 'dep8', text: '다른 사람들이 주목할 정도로 너무 느리게 움직이거나 말을 함, 또는 반대로 평상시보다 많이 움직여서, 너무 안절부절 못하거나 들떠 있음' },
    { id: 'dep9', text: '자신이 죽는 것이 더 낫다고 생각하거나 어떤 식으로든 자신을 해칠것이라고 생각함' }
  ];

  // Options for the survey responses
  const options = [
    { value: 0, text: '전혀 방해받지 않았다' },
    { value: 1, text: '며칠동안 방해받았다' },
    { value: 2, text: '7일이상 방해받았다' },
    { value: 3, text: '거의매일 방해받았다' }
  ];

  // Handle radio button change
  const handleChange = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: parseInt(value)
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate the depression score
    const depressionScore = Object.values(responses).reduce((total, value) => total + value, 0);
    
    // Update user data with the depression score
    updateUserData({ depressionScore });
    
    // Move to the next page
    nextPage();
  };

  // Check if all questions have been answered
  const isFormComplete = () => {
    return Object.values(responses).every(value => value !== null);
  };

  return (
    <div className="survey-container">
      <h1>우울증상 설문조사</h1>
      <p>각 문항을 잘 읽고, 지난 2주일 동안 얼마나 자주 느끼거나 생각했는지를 체크해 주시기 바랍니다.</p>
      
      <form onSubmit={handleSubmit}>
        <table className="survey-table">
          <thead>
            <tr>
              <th width="60%">문항</th>
              {options.map((option, index) => (
                <th key={index}>{option.text}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((question, qIndex) => (
              <tr key={qIndex}>
                <td>{qIndex + 1}. {question.text}</td>
                {options.map((option, oIndex) => (
                  <td key={oIndex}>
                    <input 
                      type="radio" 
                      name={question.id} 
                      value={option.value}
                      checked={responses[question.id] === option.value}
                      onChange={() => handleChange(question.id, option.value)}
                      required
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="button-group">
          <button type="button" className="btn prev-btn" onClick={prevPage}>이전</button>
          <button 
            type="submit" 
            className="btn next-btn"
            disabled={!isFormComplete()}
          >
            다음
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepressionSurvey;
