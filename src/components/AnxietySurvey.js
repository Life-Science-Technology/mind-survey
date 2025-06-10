import React, { useState } from 'react';

const AnxietySurvey = ({ updateUserData, nextPage, prevPage }) => {
  // Initialize all question responses to null
  const [responses, setResponses] = useState({
    anx1: null, anx2: null, anx3: null, anx4: null, 
    anx5: null, anx6: null, anx7: null
  });

  // Questions for the anxiety survey
  const questions = [
    { id: 'anx1', text: '초조하거나 불안하거나 조마조마하게 느낀다.' },
    { id: 'anx2', text: '걱정하는 것을 멈추거나 조절할 수가 없다.' },
    { id: 'anx3', text: '여러 가지 것들에 대해 걱정을 너무 많이 한다.' },
    { id: 'anx4', text: '편하게 있기가 어렵다.' },
    { id: 'anx5', text: '쉽게 짜증이 나거나 쉽게 성을 내게 된다.' },
    { id: 'anx6', text: '너무 안절부절못해서 가만히 있기가 힘들다.' },
    { id: 'anx7', text: '마치 끔찍한 일이 생길 것처럼 두렵게 느껴진다.' }
  ];

  // Options for the survey responses
  const options = [
    { value: 0, text: '전혀 방해받지 않았다' },
    { value: 1, text: '며칠동안 방해받았다' },
    { value: 2, text: '2주중 절반이상 방해받았다' },
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
    
    // Calculate the anxiety score
    const anxietyScore = Object.values(responses).reduce((total, value) => total + value, 0);
    
    // Update user data with the anxiety score
    updateUserData({ anxietyScore });
    
    // Move to the next page
    nextPage();
  };

  // Check if all questions have been answered
  const isFormComplete = () => {
    return Object.values(responses).every(value => value !== null);
  };

  return (
    <div className="survey-container">
      <h1>불안증상 설문조사</h1>
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

export default AnxietySurvey;
