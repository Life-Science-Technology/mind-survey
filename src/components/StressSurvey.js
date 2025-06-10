import React, { useState } from 'react';

const StressSurvey = ({ updateUserData, nextPage, prevPage }) => {
  // Initialize all question responses to null
  const [responses, setResponses] = useState({
    stress1: null, stress2: null, stress3: null, stress4: null, stress5: null,
    stress6: null, stress7: null, stress8: null, stress9: null, stress10: null
  });

  // Questions for the PSS (Perceived Stress Scale) survey
  const questions = [
    { id: 'stress1', text: '지난 한 달 동안 예상치 못한 일이 생겨서 기분 나빠진 적이 얼마나 있었나요?', reverse: false },
    { id: 'stress2', text: '지난 한 달 동안 중요한 일들을 통제할 수 없다고 느낀 적은 얼마나 있었나요?', reverse: false },
    { id: 'stress3', text: '지난 한 달 동안 초조하거나 스트레스가 쌓인다고 느낀 적은 얼마나 있었나요?', reverse: false },
    { id: 'stress4', text: '지난 한 달 동안 짜증 나고 성가신 일들을 성공적으로 처리한 적이 얼마나 있었나요?', reverse: true },
    { id: 'stress5', text: '지난 한 달 동안 생활 속에서 일어난 중요한 변화들을 효과적으로 대처한 적이 얼마나 있었나요?', reverse: true },
    { id: 'stress6', text: '지난 한 달 동안 개인적인 문제를 처리하는 능력에 자신감을 느낀 적은 얼마나 있었나요?', reverse: true },
    { id: 'stress7', text: '지난 한 달 동안 자기 뜻대로 일이 진행된다고 느낀 적은 얼마나 있었나요?', reverse: true },
    { id: 'stress8', text: '지난 한 달 동안 매사를 잘 컨트롤하고 있다고 느낀 적이 얼마나 있었나요?', reverse: true },
    { id: 'stress9', text: '지난 한 달 동안 당신이 통제할 수 없는 범위에서 발생한 일 때문에 화가 난 적이 얼마나 있었나요?', reverse: false },
    { id: 'stress10', text: '지난 한 달 동안 어려운 일이 너무 많이 쌓여서 극복할 수 없다고 느낀 적이 얼마나 있었나요?', reverse: false }
  ];

  // Options for the survey responses
  const options = [
    { value: 0, text: '전혀 없었다' },
    { value: 1, text: '거의 없었다' },
    { value: 2, text: '때때로 있었다' },
    { value: 3, text: '자주 있었다' },
    { value: 4, text: '매우 자주 있었다' }
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
    
    // Calculate the stress score with reverse scoring for items 4, 5, 6, 7, 8
    let stressScore = 0;
    questions.forEach(question => {
      const response = responses[question.id];
      if (question.reverse) {
        // Reverse scoring: 0->4, 1->3, 2->2, 3->1, 4->0
        stressScore += (4 - response);
      } else {
        stressScore += response;
      }
    });
    
    // Update user data with the stress score
    updateUserData({ stressScore });
    
    // Move to the next page
    nextPage();
  };

  // Check if all questions have been answered
  const isFormComplete = () => {
    return Object.values(responses).every(value => value !== null);
  };

  return (
    <div className="survey-container">
      <h1>스트레스 설문조사</h1>
      <p>각 문항을 잘 읽고, 지난 1개월 동안 얼마나 자주 느끼거나 생각했는지를 체크해 주시기 바랍니다.</p>
      
      <form onSubmit={handleSubmit}>
        <table className="survey-table">
          <thead>
            <tr>
              <th width="50%">문항</th>
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
            결과 확인
          </button>
        </div>
      </form>
    </div>
  );
};

export default StressSurvey; 