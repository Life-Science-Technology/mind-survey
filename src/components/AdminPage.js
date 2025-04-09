import React, { useState, useEffect, useCallback } from 'react';
import supabase from '../supabaseClient';
import '../styles/AdminPage.css';

const AdminPage = () => {
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // 정렬 상태 관리 - 단일 정렬
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  
  // 인증 토큰 유효성 검사
  const validateAuthToken = (token) => {
    try {
      // 토큰 형식: timestamp|hash
      const [timestamp] = token.split('|');
      const now = new Date().getTime();
      
      // 토큰 만료 시간 검사 (24시간)
      if (now - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
        return false;
      }
      
      // 실제 서비스에서는 더 복잡한 유효성 검사가 필요합니다
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // 인증 토큰 생성
  const generateAuthToken = () => {
    const timestamp = new Date().getTime();
    // 실제 서비스에서는 더 복잡한 해시 알고리즘 사용 필요
    const hash = `${timestamp}_${Math.random().toString(36).substring(2, 15)}`;
    return `${timestamp}|${hash}`;
  };
  
  // 인증 관련 상태 - 함수 선언 후에 사용
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // 세션 스토리지에서 인증 상태 가져오기 (브라우저 닫으면 사라짐)
    const authToken = sessionStorage.getItem('adminAuthToken');
    // 토큰이 있는지와 유효한지 확인
    return !!authToken && validateAuthToken(authToken);
  });

  // 데이터 로드 함수 - useCallback으로 감싸서 메모이제이션 적용
  const loadParticipants = useCallback(async (isInitialLoad = false) => {
    try {
      // 초기 로드일 때만 로딩 상태 표시
      if (isInitialLoad) {
        setIsLoading(true);
      }
      
      const { data, error } = await supabase
        .from('survey-person')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
        
      if (error) {
        throw error;
      }
      
      setParticipants(data);
      setError(null);
    } catch (error) {
      console.error('Error loading participants:', error);
      setError('Error loading participants');
    } finally {
      setIsLoading(false);
    }
  }, [sortField, sortDirection]);

  // 컴포넌트가 마운트될 때 초기 설정
  useEffect(() => {
    // 인증되었을 때만 데이터 로드
    if (isAuthenticated) {
      loadParticipants(true);
    }
  }, [isAuthenticated, loadParticipants]);
  
  // 정렬 기준이 변경될 때 데이터 로드 (깨빡임 없이)
  useEffect(() => {
    // 초기 로드가 아닐 때만 실행
    if (!isLoading) {
      loadParticipants(false);
    }
  }, [sortField, sortDirection, isLoading, loadParticipants]);

  // 정렬 처리 함수 - 단일 정렬
  const handleSort = (field) => {
    if (field === sortField) {
      // 같은 필드를 다시 클릭하면 정렬 방향 전환
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드를 클릭하면 해당 필드로 정렬하고 내림차순 기본값
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 정렬 화살표 표시 함수
  const renderSortArrow = (field) => {
    if (field !== sortField) return null;
    
    // 화살표 표시
    return (
      <span className="sort-indicator">
        {sortDirection === 'asc' ? ' ▲' : ' ▼'}
      </span>
    );
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // CSV 파일 다운로드 함수
  const downloadCSV = () => {
    if (!participants || participants.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }
    
    // CSV 헤더
    const headers = [
      '이름', 
      '이메일', 
      '전화번호', 
      '우울점수', 
      '불안점수', 
      '등록일'
    ];
    
    // 데이터 행 생성
    const rows = participants.map(person => [
      person.name,
      person.email,
      // 전화번호 앞에 작은따옴표 추가하여 텍스트로 인식되도록 처리
      `="${person.phone}"`,
      person.depressive,
      person.anxiety,
      formatDate(person.created_at)
    ]);
    
    // CSV 데이터 생성
    let csvContent = headers.join(',') + '\n';
    
    rows.forEach(row => {
      // 콤마가 포함된 필드는 따옴표로 감싸기
      const formattedRow = row.map(field => {
        // 문자열인 경우에만 처리
        if (typeof field === 'string') {
          // 따옴표가 포함되어 있으면 따옴표를 두 번 입력하여 이스케이프
          const escapedField = field.replace(/"/g, '""');
          // 콤마, 다음 줄, 따옴표가 포함되어 있으면 따옴표로 감싸기
          return /[,\n"]/.test(field) ? `"${escapedField}"` : field;
        }
        return field;
      }).join(',');
      
      csvContent += formattedRow + '\n';
    });
    
    // CSV 파일 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // 현재 날짜를 파일명에 추가
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `설문조사_참가자_목록_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PIN 코드 인증 함수
  const handlePinSubmit = (e) => {
    e.preventDefault();
    // .env 파일에서 관리자 PIN 코드 가져오기
    const adminPin = process.env.REACT_APP_ADMIN_PIN;
    
    // 환경변수가 설정되지 않은 경우 오류 메시지 표시
    if (!adminPin) {
      setPinError('관리자 PIN 코드가 설정되지 않았습니다. 관리자에게 문의하세요.');
      return;
    }
    
    if (pinCode === adminPin) {
      // 인증 성공 시 세션 스토리지에 토큰 저장
      const authToken = generateAuthToken();
      sessionStorage.setItem('adminAuthToken', authToken);
      setIsAuthenticated(true);
      setPinError('');
      // 인증 성공 후 데이터 로드
      loadParticipants(true);
    } else {
      setPinError('잘못된 PIN 코드입니다.');
      // 잘못된 인증 시도 로깅 (실제 서비스에서는 서버에 로깅하는 것이 좋음)
      console.warn(`잘못된 인증 시도: ${new Date().toISOString()}`);
    }
  };
  
  // PIN 코드 변경 함수
  const handlePinChange = (e) => {
    setPinCode(e.target.value);
    if (pinError) setPinError('');
  };



  // 인증 화면 렌더링
  const renderAuthForm = () => {
    return (
      <div className="auth-container">
        <h2>관리자 인증</h2>
        <form onSubmit={handlePinSubmit} className="pin-form">
          <div className="form-group">
            <label htmlFor="pinCode">관리자 PIN 코드를 입력해주세요:</label>
            <input
              type="password"
              id="pinCode"
              value={pinCode}
              onChange={handlePinChange}
              placeholder="PIN 코드 입력"
              maxLength={4}
              required
            />
          </div>
          {pinError && <div className="error-message">{pinError}</div>}
          <button type="submit" className="pin-submit-btn">인증</button>
        </form>
      </div>
    );
  };

  return (
    <div className="admin-container">
      <h1>관리자 페이지</h1>
      
      {!isAuthenticated ? (
        renderAuthForm()
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : isLoading ? (
        <p>데이터를 불러오는 중...</p>
      ) : participants.length === 0 ? (
        <p>등록된 참가자가 없습니다.</p>
      ) : (
        <>
          <div className="admin-controls">
            <button className="refresh-btn" onClick={() => loadParticipants(true)}>
              데이터 새로고침
            </button>
            <button className="download-btn" onClick={downloadCSV}>
              CSV 다운로드
            </button>
          </div>
          
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>전화번호</th>
                  <th onClick={() => handleSort('depressive')}>
                    우울점수{renderSortArrow('depressive')}
                  </th>
                  <th onClick={() => handleSort('anxiety')}>
                    불안점수{renderSortArrow('anxiety')}
                  </th>
                  <th onClick={() => handleSort('created_at')}>
                    등록일{renderSortArrow('created_at')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  participants.map((participant, index) => (
                    <tr key={participant.id || index}>
                      <td>{index + 1}</td>
                      <td>{participant.name || '-'}</td>
                      <td>{participant.email || '-'}</td>
                      <td>{participant.phone || '-'}</td>
                      <td className={participant.depressive >= 12 ? 'highlight' : ''}>
                        {participant.depressive || 0}
                      </td>
                      <td className={participant.anxiety >= 10 ? 'highlight' : ''}>
                        {participant.anxiety || 0}
                      </td>
                      <td>{formatDate(participant.created_at)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          
          <div className="admin-footer">
            <p>총 {participants.length}명의 대기자가 등록되어 있습니다.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPage;
