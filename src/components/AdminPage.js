import React, { useState, useEffect, useCallback } from 'react';
import supabase, { ensureUserSession } from '../supabaseClient';
import '../styles/AdminPage.css';

const AdminPage = () => {
  const [participants, setParticipants] = useState([]);
  const [participantFiles, setParticipantFiles] = useState({});
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showFiles, setShowFiles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState(null);
  // 정렬 상태 관리 - 단일 정렬
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [groupFilter, setGroupFilter] = useState('all'); // 집단 필터 상태 추가
  
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
      
      // RLS를 위한 사용자 세션 확보 (실패해도 계속 진행)
      const user = await ensureUserSession();
      console.log('관리자 세션:', user?.id || 'anonymous');
      
      // 보안 함수를 통한 데이터 조회 (RLS 우회)
      const { data, error } = await supabase
        .rpc('get_participants_for_admin');
        
      if (error) {
        console.error('관리자 데이터 조회 오류:', error);
        throw error;
      }
      
      setParticipants(data || []);
      setError(null);
    } catch (error) {
      console.error('Error loading participants:', error);
      setError('관리자 데이터 로드 실패: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []); // sortField, sortDirection 의존성 제거

  // 참가자 파일 목록 조회 함수
  const loadParticipantFiles = useCallback(async (participantId) => {
    try {
      setIsLoadingFiles(true);
      
      // RLS를 위한 사용자 세션 확보 (실패해도 계속 진행)
      const user = await ensureUserSession();
      console.log('파일 조회 세션:', user?.id || 'anonymous');
      
      // 보안 함수를 통한 파일 목록 조회
      const { data, error } = await supabase
        .rpc('get_participant_files_for_admin', { participant_id_param: participantId });
        
      if (error) {
        console.error('파일 목록 조회 오류:', error);
        throw error;
      }
      
      setParticipantFiles(prev => ({
        ...prev,
        [participantId]: data || []
      }));
      
    } catch (error) {
      console.error('파일 목록 로드 오류:', error);
      setError('파일 목록 로드 실패: ' + error.message);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // 파일 다운로드 함수
  const downloadFile = async (filePath, fileName) => {
    try {
      // 관리자 세션 확보
      const user = await ensureUserSession();
      if (!user) {
        throw new Error('관리자 세션을 확인할 수 없습니다.');
      }

      // Service Key를 사용하여 파일 다운로드 (RLS 우회)
      // 실제로는 서버 사이드에서 구현해야 하지만, 현재는 클라이언트에서 시도
      const { data, error } = await supabase.storage
        .from('participant-files')
        .download(filePath);

      if (error) {
        throw error;
      }

      // 파일 다운로드
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('파일 다운로드 완료:', fileName);
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert(`파일 다운로드 실패: ${error.message}\n\n참고: 현재 Storage RLS 정책으로 인해 클라이언트에서 직접 다운로드가 제한될 수 있습니다.`);
    }
  };

  // 파일 형식별 아이콘 반환
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'identity_card':
      case 'idCard':
        return '🆔';
      case 'bank_account':
      case 'bankAccount':
        return '🏦';
      case 'signature_image':
      case 'signatureImage':
        return '✍️';
      case 'consent_form':
        return '📋';
      default:
        return '📄';
    }
  };

  // 파일 형식별 이름 반환
  const getFileTypeName = (fileType) => {
    switch (fileType) {
      case 'identity_card':
      case 'idCard':
        return '신분증';
      case 'bank_account':
      case 'bankAccount':
        return '통장사본';
      case 'signature_image':
      case 'signatureImage':
        return '서명이미지';
      case 'consent_form':
        return '동의서';
      default:
        return fileType;
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 컴포넌트가 마운트될 때 초기 설정
  useEffect(() => {
    // 인증되었을 때만 데이터 로드
    if (isAuthenticated) {
      loadParticipants(true);
    }
  }, [isAuthenticated, loadParticipants]);
  
  // 집단 분류 함수
  const getGroupType = (participant) => {
    const { depressive, stress } = participant;
    
    // stress가 null인 경우 (기존 데이터)
    if (stress === null) {
      if (depressive >= 10) {
        return { type: 'depression', label: '우울 집단' };
      } else {
        return { type: 'unknown', label: '미분류' };
      }
    }
    
    // 새로운 분류 기준
    if (depressive >= 10) {
      return { type: 'depression', label: '우울 집단' };
    } else if (stress >= 17) {
      return { type: 'stress', label: '스트레스 고위험 집단' };
    } else {
      return { type: 'normal', label: '정상 집단' };
    }
  };

  // 필터링 및 정렬된 참가자 목록을 계산하는 함수
  const getFilteredAndSortedParticipants = () => {
    if (!participants || participants.length === 0) return [];
    
    // 필터링
    let filteredParticipants = participants;
    if (groupFilter !== 'all') {
      filteredParticipants = participants.filter(participant => {
        const group = getGroupType(participant);
        return group.type === groupFilter;
      });
    }
    
    // 정렬
    return [...filteredParticipants].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // null 값 처리
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      
      // 문자열과 숫자 비교
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

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
      '스트레스점수',
      '등록일',
      '집단'
    ];
    
    // CSV 내용 생성
    let csvContent = headers.join(',') + '\n';
    
    participants.forEach(person => {
      const row = [
        person.name,
        person.email,
        // 전화번호 앞에 작은따옴표 추가하여 텍스트로 인식되도록 처리
        `="${person.phone}"`,
        person.depressive,
        person.anxiety,
        person.stress !== null ? person.stress : '-',
        formatDate(person.created_at),
        getGroupType(person).label
      ];
      
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
            <select 
              value={groupFilter} 
              onChange={(e) => setGroupFilter(e.target.value)}
              className="group-filter-dropdown"
            >
              <option value="all">전체</option>
              <option value="depression">우울 집단</option>
              <option value="stress">스트레스 고위험 집단</option>
              <option value="normal">정상 집단</option>
            </select>
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
                  <th onClick={() => handleSort('stress')}>
                    스트레스점수{renderSortArrow('stress')}
                  </th>
                  <th onClick={() => handleSort('created_at')}>
                    등록일{renderSortArrow('created_at')}
                  </th>
                  <th>집단</th>
                  <th>업로드된 파일</th>
                </tr>
              </thead>
              <tbody>
                {
                  getFilteredAndSortedParticipants().map((participant, index) => (
                    <tr key={participant.id || index}>
                      <td>{index + 1}</td>
                      <td>{participant.name || '-'}</td>
                      <td>{participant.email || '-'}</td>
                      <td>{participant.phone || '-'}</td>
                      <td className={participant.depressive >= 10 ? 'highlight' : ''}>
                        {participant.depressive || 0}
                      </td>
                      <td className={participant.anxiety >= 10 ? 'highlight' : ''}>
                        {participant.anxiety || 0}
                      </td>
                      <td className={participant.stress !== null && participant.stress >= 17 ? 'highlight' : ''}>
                        {participant.stress !== null ? participant.stress : '-'}
                      </td>
                      <td>{formatDate(participant.created_at)}</td>
                      <td className={`group-${getGroupType(participant).type}`}>
                        {getGroupType(participant).label}
                      </td>
                      <td>
                        <button 
                          className="file-view-btn"
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setShowFiles(true);
                            loadParticipantFiles(participant.id);
                          }}
                        >
                          📁 파일 보기
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          
          <div className="admin-footer">
            <p>총 {participants.length}명의 대기자가 등록되어 있습니다.
            {groupFilter !== 'all' && ` (현재 ${getFilteredAndSortedParticipants().length}명 표시)`}
            </p>
          </div>
        </>
      )}

      {/* 파일 목록 모달 */}
      {showFiles && selectedParticipant && (
        <div className="file-modal-overlay" onClick={() => setShowFiles(false)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h3>{selectedParticipant.name}님의 업로드된 파일</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowFiles(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="file-modal-content">
              {isLoadingFiles ? (
                <p>파일 목록을 불러오는 중...</p>
              ) : participantFiles[selectedParticipant.id]?.length > 0 ? (
                <div className="file-list">
                  {participantFiles[selectedParticipant.id].map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <div className="file-details">
                          <div className="file-name">{file.file_name}</div>
                          <div className="file-meta">
                            <span className="file-type">{getFileTypeName(file.file_type)}</span>
                            <span className="file-size">{formatFileSize(file.file_size)}</span>
                            <span className="file-date">{formatDate(file.uploaded_at)}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="file-download-btn"
                        onClick={() => downloadFile(file.file_path, file.file_name)}
                      >
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>업로드된 파일이 없습니다.</p>
              )}
            </div>
            
            <div className="file-modal-footer">
              <button 
                className="modal-close-btn secondary"
                onClick={() => setShowFiles(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
