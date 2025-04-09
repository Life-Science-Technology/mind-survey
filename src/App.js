import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import IntroPage from './components/IntroPage';
import InfoForm from './components/InfoForm';
import DepressionSurvey from './components/DepressionSurvey';
import AnxietySurvey from './components/AnxietySurvey';
import Results from './components/Results';
import AdminPage from './components/AdminPage';

// 설문 앱 컴포넌트
const SurveyApp = () => {
  // State to track which page is currently shown
  const [page, setPage] = useState(0);
  
  // State to store user data
  const [userData, setUserData] = useState({
    email: '',
    name: '',
    phone: '',
    depressionScore: 0,
    anxietyScore: 0
  });

  // Function to move to the next page
  const nextPage = () => {
    setPage(prevPage => prevPage + 1);
  };

  // Function to move to the previous page
  const prevPage = () => {
    setPage(prevPage => prevPage - 1);
  };

  // Function to restart the survey
  const restartSurvey = () => {
    setPage(0);
    setUserData({
      email: '',
      name: '',
      phone: '',
      depressionScore: 0,
      anxietyScore: 0
    });
  };

  // Function to update user data
  const updateUserData = (newData) => {
    setUserData(prevData => ({
      ...prevData,
      ...newData
    }));
  };

  // Render the appropriate page based on the current page state
  const renderPage = () => {
    switch(page) {
      case 0:
        return <IntroPage 
                 nextPage={nextPage} 
               />;
      case 1:
        return <InfoForm 
                 userData={userData} 
                 updateUserData={updateUserData} 
                 nextPage={nextPage} 
               />;
      case 2:
        return <DepressionSurvey 
                 updateUserData={updateUserData} 
                 nextPage={nextPage} 
                 prevPage={prevPage} 
               />;
      case 3:
        return <AnxietySurvey 
                 updateUserData={updateUserData} 
                 nextPage={nextPage} 
                 prevPage={prevPage} 
               />;
      case 4:
        return <Results 
                 userData={userData} 
                 restartSurvey={restartSurvey} 
               />;
      default:
        return <IntroPage 
                 nextPage={nextPage} 
               />;
    }
  };

  return (
    <div className="App">
      {page > 0 && (
        <>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${(page / 4) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="page-indicator">
            <span>페이지 {page}/4</span>
          </div>
        </>
      )}
      <div className="survey-container">
        {renderPage()}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SurveyApp />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
