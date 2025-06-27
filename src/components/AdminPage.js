import React, { useState, useEffect, useCallback } from 'react';
import supabase, { ensureUserSession } from '../supabaseClient';
import JSZip from 'jszip';
import { STEP_DESCRIPTIONS } from '../config/registrationSteps';
import '../styles/AdminPage.css';

const RECRUITMENT_GOALS = {
  depression: 50,
  stress: 25,
  normal: 25,
};

const AdminPage = () => {
  const [participants, setParticipants] = useState([]);
  const [participantFiles, setParticipantFiles] = useState({});
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showFiles, setShowFiles] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState(null);
  // 정렬 상태 관리 - 단일 정렬
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [groupFilter, setGroupFilter] = useState('all'); // 집단 필터 상태 추가
  const [recruitmentStatus, setRecruitmentStatus] = useState({
    isRecruiting: true,
    lastUpdated: null,
    notes: null
  }); // 모집 상태 관리

  
  // 서버 기반 관리자 인증
  const authenticateAdmin = async (pin) => {
    try {
      const { data, error } = await supabase.rpc('authenticate_admin', { admin_pin: pin });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          return { success: true, token: result.token };
        } else {
          return { success: false, message: result.message };
        }
      }
      
      return { success: false, message: 'Authentication failed' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, message: 'Authentication error' };
    }
  };
  
  // 토큰 유효성 검사 (서버 기반)
  const validateAuthToken = async (token) => {
    try {
      const { data, error } = await supabase.rpc('validate_admin_token', { admin_token: token });
      return !error && data === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };
  
  // 인증 관련 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 모집 상태 로드 함수
  const loadRecruitmentStatus = useCallback(async () => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }
      
      const { data, error } = await supabase
        .rpc('get_recruitment_status_for_admin', { admin_token: adminToken });
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const status = data[0];
        setRecruitmentStatus({
          isRecruiting: status.is_recruiting,
          lastUpdated: status.last_updated,
          notes: status.notes
        });
      }
    } catch (error) {
      console.error('Failed to load recruitment status:', error);
    }
  }, []);

  // 모집 상태 업데이트 함수
  const updateRecruitmentStatus = async (newStatus) => {
    const statusText = newStatus ? '시작' : '종료';
    const confirmMessage = `정말로 참여자 모집을 ${statusText}하시겠습니까?\n\n${newStatus ? '모집이 시작되면 새로운 참여자들이 등록할 수 있습니다.' : '모집이 종료되면 더 이상 새로운 참여자가 등록할 수 없습니다.'}`;
    
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }
      
      const { error } = await supabase
        .rpc('update_recruitment_status', { 
          admin_token: adminToken,
          new_status: newStatus,
          admin_notes: `Status changed to ${newStatus ? 'recruiting' : 'closed'} by admin`
        });
        
      if (error) {
        throw error;
      }
      
      // 상태 업데이트 후 다시 로드
      await loadRecruitmentStatus();
      
      // 성공 메시지
      alert(`참여자 모집이 성공적으로 ${statusText}되었습니다.`);
      
    } catch (error) {
      console.error('Failed to update recruitment status:', error);
      alert(`모집 상태 업데이트 실패: ${error.message}`);
    }
  };

  // 모든 참가자의 파일 정보를 미리 로드하는 함수
  const loadAllParticipantFiles = useCallback(async () => {
    try {
      // 저장된 관리자 토큰 가져오기
      const adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }
      
      // 토큰 기반 모든 파일 목록 조회
      const { data, error } = await supabase
        .rpc('get_all_participant_files_for_admin', { admin_token: adminToken });
        
      if (error) {
        throw error;
      }
      
      // 참가자별로 파일 그룹화
      const filesByParticipant = {};
      if (data) {
        data.forEach(file => {
          if (!filesByParticipant[file.participant_id]) {
            filesByParticipant[file.participant_id] = [];
          }
          filesByParticipant[file.participant_id].push({
            file_id: file.file_id,
            file_name: file.file_name,
            file_type: file.file_type,
            file_path: file.file_path,
            file_size: file.file_size,
            uploaded_at: file.uploaded_at
          });
        });
      }
      
      setParticipantFiles(filesByParticipant);
      
    } catch (error) {
    }
  }, []);

  // 데이터 로드 함수 - useCallback으로 감싸서 메모이제이션 적용
  const loadParticipants = useCallback(async (isInitialLoad = false) => {
    try {
      // 초기 로드일 때만 로딩 상태 표시
      if (isInitialLoad) {
        setIsLoading(true);
      }
      
      // 저장된 관리자 토큰 가져오기
      const adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }
      
      // 토큰 기반 데이터 조회
      const { data, error } = await supabase
        .rpc('get_participants_for_admin', { admin_token: adminToken });
        
      if (error) {
        throw error;
      }
      
      setParticipants(data || []);
      setError(null);
      
      // 참가자 데이터 로드 후 모든 파일 정보와 모집 상태도 로드
      await loadAllParticipantFiles();
      await loadRecruitmentStatus();
      
    } catch (error) {
      setError('관리자 데이터 로드 실패: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [loadAllParticipantFiles, loadRecruitmentStatus]); // 의존성 추가

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      const adminToken = sessionStorage.getItem('adminToken');
      const authToken = sessionStorage.getItem('adminAuthToken');
      
      if (adminToken && authToken) {
        const isValid = await validateAuthToken(adminToken);
        setIsAuthenticated(isValid);
        
        if (isValid) {
          // 인증 상태가 유효하면 데이터 로드
          loadParticipants(true);
        } else {
          // 토큰이 무효하면 세션 클리어
          sessionStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminAuthToken');
        }
      }
    };
    
    checkAuthStatus();
  }, [loadParticipants]);

  // 참가자 파일 목록 조회 함수
  const loadParticipantFiles = useCallback(async (participantId) => {
    try {
      setIsLoadingFiles(true);
      
      // 저장된 관리자 토큰 가져오기
      const adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }
      
      // 토큰 기반 파일 목록 조회
      const { data, error } = await supabase
        .rpc('get_participant_files_for_admin', { 
          admin_token: adminToken, 
          participant_id_param: participantId 
        });
        
      if (error) {
        throw error;
      }
      
      setParticipantFiles(prev => ({
        ...prev,
        [participantId]: data || []
      }));
      
    } catch (error) {
      setError('파일 목록 로드 실패: ' + error.message);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // 업로드 상태 확인 함수 (실제 파일 존재 여부 기반)
  const getUploadStatus = (participant) => {
    const participantId = participant.id;
    const files = participantFiles[participantId] || [];
    
    // 실제 업로드된 파일 타입들을 확인
    const uploadedTypes = files.map(file => file.file_type);
    
    return {
      signature: uploadedTypes.includes('signature_image'),
      idCard: uploadedTypes.includes('identity_card'),
      bankAccount: uploadedTypes.includes('bank_account')
    };
  };

  // 업로드된 파일 개수 확인 함수 (실제 파일 기반)
  const getUploadedFileCount = (participant) => {
    const participantId = participant.id;
    const files = participantFiles[participantId] || [];
    return files.length;
  };

  // 파일 다운로드 함수 (개별)
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

    } catch (error) {
      alert(`파일 다운로드 실패: ${error.message}\n\n참고: 현재 Storage RLS 정책으로 인해 클라이언트에서 직접 다운로드가 제한될 수 있습니다.`);
    }
  };

  // 전체 파일 ZIP 다운로드 함수
  const downloadAllFiles = async (participant) => {
    try {
      const participantId = participant.id;
      const files = participantFiles[participantId];
      
      if (!files || files.length === 0) {
        alert('다운로드할 파일이 없습니다.');
        return;
      }

      const zip = new JSZip();
      const downloadPromises = [];
      let successCount = 0;

      // 각 파일을 ZIP에 추가
      for (const file of files) {
        const promise = supabase.storage
          .from('participant-files')
          .download(file.file_path)
          .then(({ data, error }) => {
            if (error) {
              return null;
            }
            return { data, fileName: file.file_name };
          });
        
        downloadPromises.push(promise);
      }

      // 모든 파일 다운로드 완료 대기
      const results = await Promise.all(downloadPromises);
      
      // 성공한 파일들만 ZIP에 추가
      results.forEach(result => {
        if (result && result.data) {
          zip.file(result.fileName, result.data);
          successCount++;
        }
      });

      if (successCount === 0) {
        alert('다운로드할 수 있는 파일이 없습니다.');
        return;
      }

      // ZIP 파일 생성 및 다운로드
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // 파일명: 이름_이메일_전화번호.zip (특수문자 제거)
      const safeName = participant.name.replace(/[^a-zA-Z0-9가-힣]/g, '');
      const safeEmail = participant.email.replace(/[^a-zA-Z0-9@._-]/g, '');
      const safePhone = participant.phone.replace(/[^0-9]/g, '');
      const zipFileName = `${safeName}_${safeEmail}_${safePhone}.zip`;
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (successCount < files.length) {
        alert(`일부 파일 다운로드에 실패했습니다. (성공: ${successCount}/${files.length})`);
      }
    } catch (error) {
      alert(`ZIP 다운로드 실패: ${error.message}`);
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

  // 확정여부 변경 함수
  const handleConfirmationChange = async (participantId, status) => {
    try {
      // 저장된 관리자 토큰 가져오기
      const adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }
      
      // 토큰 기반 데이터베이스 업데이트
      const { error } = await supabase
        .rpc('update_participant_confirmation', { 
          admin_token: adminToken,
          participant_id_param: participantId, 
          confirmation_status_param: status 
        });

      if (error) {
        throw error;
      }

      // 성공 시 참가자 데이터 다시 로드하여 UI 업데이트
      await loadParticipants(false);
      
      // 성공 메시지 표시
      const statusText = status === 'approved' ? '승인' : '거부';
      console.log(`참가자 ${participantId} 확정여부가 ${statusText}로 업데이트되었습니다.`);
      
    } catch (error) {
      alert(`확정여부 업데이트 실패: ${error.message}`);
    }
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

  // 확정자 수 계산 함수
  const getConfirmedCounts = () => {
    const counts = {
      depression: 0,
      stress: 0,
      normal: 0,
    };

    participants.forEach(p => {
      if (p.confirmation_status === 'approved') {
        const group = getGroupType(p).type;
        if (counts.hasOwnProperty(group)) {
          counts[group]++;
        }
      }
    });

    return counts;
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

  // 등록 단계 포맷팅 함수
  const formatRegistrationStep = (step, confirmationStatus) => {
    // "부" 선택 시 "참여 거부"로 표시
    if (confirmationStatus === 'rejected') {
      return '참여 거부';
    }
    
    if (step === null || step === undefined) return '-';
    const description = STEP_DESCRIPTIONS[step] || '알 수 없음';
    return `${step}: ${description}`;
  };
  
  // 값 변환 함수들
  const formatUploadMethod = (method) => {
    if (!method) return '-';
    switch(method) {
      case 'upload': return '업로드';
      case 'direct': return '직접 전달';
      default: return method;
    }
  };

  const formatConfirmationStatus = (status) => {
    if (!status) return '-';
    switch(status) {
      case 'approved': return '승인';
      case 'rejected': return '거부';
      default: return status;
    }
  };

  // CSV 파일 다운로드 함수
  const downloadCSV = () => {
    if (!participants || participants.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }
    
    // CSV 헤더 (모든 필드 포함)
    const headers = [
      'ID',
      '이름', 
      '이메일', 
      '전화번호',
      '주소',
      '성별',
      '생년월일',
      '우울점수', 
      '불안점수',
      '스트레스점수',
      '등록일',
      '동의날짜',
      '등록단계',
      '실험참여동의',
      '데이터사용동의',
      '제3자제공동의',
      '서명업로드방법',
      '신분증업로드방법',
      '통장업로드방법',
      '확정상태',
      '워치배송주소',
      '집단'
    ];
    
    // CSV 내용 생성
    let csvContent = headers.join(',') + '\n';
    
    participants.forEach(person => {
      const row = [
        person.id,
        person.name,
        person.email,
        // 전화번호 앞에 작은따옴표 추가하여 텍스트로 인식되도록 처리
        `="${person.phone}"`,
        person.address || '-',
        person.gender || '-',
        person.birth_date || '-',
        person.depressive,
        person.anxiety,
        person.stress !== null ? person.stress : '-',
        formatDate(person.created_at),
        person.consent_date || '-',
        formatRegistrationStep(person.registration_step, person.confirmation_status),
        person.experiment_consent ? '동의' : '미동의',
        person.data_usage_consent ? '동의' : '미동의',
        person.third_party_consent ? '동의' : '미동의',
        formatUploadMethod(person.signature_upload_method),
        formatUploadMethod(person.id_card_upload_method),
        formatUploadMethod(person.bank_account_upload_method),
        formatConfirmationStatus(person.confirmation_status),
        person.watch_delivery_address || '-',
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
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 서버 기반 인증
      const result = await authenticateAdmin(pinCode);
      
      if (result.success) {
        // 인증 성공 시 토큰 저장
        sessionStorage.setItem('adminToken', result.token);
        sessionStorage.setItem('adminAuthToken', 'authenticated'); // 기존 로직 호환성
        setIsAuthenticated(true);
        setPinError('');
        // 인증 성공 후 데이터 로드
        loadParticipants(true);
      } else {
        setPinError(result.message || '잘못된 PIN 코드입니다.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setPinError('인증 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };
  
  // PIN 코드 변경 함수
  const handlePinChange = (e) => {
    setPinCode(e.target.value);
    if (pinError) setPinError('');
  };

  // 상세 정보 모달 렌더링
  const renderDetailsModal = () => {
    if (!selectedParticipant) return null;
    
    const formatBoolean = (value) => value ? '동의' : '미동의';
    const formatNullableDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('ko-KR');
    };
    
    return (
      <div className="file-modal-overlay" onClick={() => setShowDetails(false)}>
        <div className="file-modal details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="file-modal-header">
            <h3>{selectedParticipant.name}님의 상세 정보</h3>
            <button 
              className="modal-close-btn"
              onClick={() => setShowDetails(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="file-modal-content">
            <div className="details-content">
              <div className="detail-item">
                <span className="detail-label">이름:</span>
                <span className="detail-value">{selectedParticipant.name || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">이메일:</span>
                <span className="detail-value">{selectedParticipant.email || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">전화번호:</span>
                <span className="detail-value">{selectedParticipant.phone || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">성별:</span>
                <span className="detail-value">{selectedParticipant.gender === 'male' ? '남' : selectedParticipant.gender === 'female' ? '여' : selectedParticipant.gender || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">생년월일:</span>
                <span className="detail-value">{formatNullableDate(selectedParticipant.birth_date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">주소:</span>
                <span className="detail-value">{selectedParticipant.address || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">워치 배송 주소:</span>
                <span className="detail-value">{selectedParticipant.watch_delivery_address || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">우울 점수:</span>
                <span className={`detail-value ${selectedParticipant.depressive >= 10 ? 'highlight-score' : ''}`}>
                  {selectedParticipant.depressive || 0}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">불안 점수:</span>
                <span className={`detail-value ${selectedParticipant.anxiety >= 10 ? 'highlight-score' : ''}`}>
                  {selectedParticipant.anxiety || 0}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">스트레스 점수:</span>
                <span className={`detail-value ${selectedParticipant.stress !== null && selectedParticipant.stress >= 17 ? 'highlight-score' : ''}`}>
                  {selectedParticipant.stress !== null ? selectedParticipant.stress : '-'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">집단 분류:</span>
                <span className={`detail-value group-${getGroupType(selectedParticipant).type}`}>
                  {getGroupType(selectedParticipant).label}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">실험 참여 동의:</span>
                <span className={`detail-value ${selectedParticipant.experiment_consent ? 'consent-yes' : 'consent-no'}`}>
                  {formatBoolean(selectedParticipant.experiment_consent)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">데이터 사용 동의:</span>
                <span className={`detail-value ${selectedParticipant.data_usage_consent ? 'consent-yes' : 'consent-no'}`}>
                  {formatBoolean(selectedParticipant.data_usage_consent)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">제3자 제공 동의:</span>
                <span className={`detail-value ${selectedParticipant.third_party_consent ? 'consent-yes' : 'consent-no'}`}>
                  {formatBoolean(selectedParticipant.third_party_consent)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">동의 날짜:</span>
                <span className="detail-value">{formatNullableDate(selectedParticipant.consent_date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">등록 날짜:</span>
                <span className="detail-value">{formatDate(selectedParticipant.created_at)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">등록 단계:</span>
                <span className="detail-value">{formatRegistrationStep(selectedParticipant.registration_step, selectedParticipant.confirmation_status)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">확정 상태:</span>
                <span className={`detail-value confirmation-${selectedParticipant.confirmation_status || 'pending'}`}>
                  {selectedParticipant.confirmation_status === 'approved' ? '승인' : 
                   selectedParticipant.confirmation_status === 'rejected' ? '거부' : '대기 중'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="file-modal-footer">
            <button 
              className="modal-close-btn secondary"
              onClick={() => setShowDetails(false)}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
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
        <div className="loading-container">
          <p>📊 데이터를 불러오는 중...</p>
          <p className="loading-detail">참가자 정보와 파일 목록을 조회하고 있습니다.</p>
        </div>
      ) : participants.length === 0 ? (
        <p>등록된 참가자가 없습니다.</p>
      ) : (
        <>
          <div className="summary-container">
            <div className="summary-header">
              <h3>확정자 현황 (충원 목표)</h3>
              <div className="recruitment-status-display">
                <span className={`status-badge ${recruitmentStatus.isRecruiting ? 'recruiting' : 'closed'}`}>
                  {recruitmentStatus.isRecruiting ? '충원중' : '충원 완료'}
                </span>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">우울 집단</span>
                <span className="summary-value">{getConfirmedCounts().depression} / {RECRUITMENT_GOALS.depression}명</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">스트레스 고위험 집단</span>
                <span className="summary-value">{getConfirmedCounts().stress} / {RECRUITMENT_GOALS.stress}명</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">정상 집단</span>
                <span className="summary-value">{getConfirmedCounts().normal} / {RECRUITMENT_GOALS.normal}명</span>
              </div>
            </div>
            <div className="recruitment-controls">
              <button 
                className={`recruitment-toggle-btn ${recruitmentStatus.isRecruiting ? 'stop' : 'start'}`}
                onClick={() => updateRecruitmentStatus(!recruitmentStatus.isRecruiting)}
              >
                {recruitmentStatus.isRecruiting ? '참여자 모집 종료' : '참여자 모집 시작'}
              </button>
              {recruitmentStatus.lastUpdated && (
                <div className="last-updated">
                  마지막 업데이트: {formatDate(recruitmentStatus.lastUpdated)}
                </div>
              )}
            </div>
          </div>

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
                  <th rowSpan="2">No.</th>
                  <th rowSpan="2">이름</th>
                  <th rowSpan="2">이메일</th>
                  <th rowSpan="2">전화번호</th>
                  <th rowSpan="2" onClick={() => handleSort('depressive')}>
                    우울점수{renderSortArrow('depressive')}
                  </th>
                  <th rowSpan="2" onClick={() => handleSort('anxiety')}>
                    불안점수{renderSortArrow('anxiety')}
                  </th>
                  <th rowSpan="2" onClick={() => handleSort('stress')}>
                    스트레스점수{renderSortArrow('stress')}
                  </th>
                  <th rowSpan="2" onClick={() => handleSort('created_at')}>
                    등록일{renderSortArrow('created_at')}
                  </th>
                  <th rowSpan="2" onClick={() => handleSort('registration_step')}>
                    등록단계{renderSortArrow('registration_step')}
                  </th>
                  <th rowSpan="2">집단</th>
                  <th rowSpan="2">업로드 상태</th>
                  <th rowSpan="2">업로드된 파일</th>
                  <th rowSpan="2">상세 정보</th>
                  <th colSpan="2">확정여부</th>
                </tr>
                <tr>
                  <th>가</th>
                  <th>부</th>
                </tr>
              </thead>
              <tbody>
                {
                  getFilteredAndSortedParticipants().map((participant, index) => {
                    const uploadStatus = getUploadStatus(participant);
                    const fileCount = getUploadedFileCount(participant);
                    
                    return (
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
                        <td className={`registration-step-${participant.confirmation_status === 'rejected' ? 'rejected' : (participant.registration_step || 0)}`}>
                          {formatRegistrationStep(participant.registration_step, participant.confirmation_status)}
                        </td>
                        <td className={`group-${getGroupType(participant).type}`}>
                          {getGroupType(participant).label}
                        </td>
                        <td>
                          <div className="upload-status">
                            <span className={`status-item ${uploadStatus.signature ? 'uploaded' : 'pending'}`}>
                              서명: {uploadStatus.signature ? '✅' : '❌'}
                            </span>
                            <span className={`status-item ${uploadStatus.idCard ? 'uploaded' : 'pending'}`}>
                              신분증: {uploadStatus.idCard ? '✅' : '❌'}
                            </span>
                            <span className={`status-item ${uploadStatus.bankAccount ? 'uploaded' : 'pending'}`}>
                              통장: {uploadStatus.bankAccount ? '✅' : '❌'}
                            </span>
                          </div>
                        </td>
                        <td>
                          {fileCount > 0 ? (
                            <button 
                              className="file-view-btn"
                              onClick={() => {
                                setSelectedParticipant(participant);
                                setShowFiles(true);
                                loadParticipantFiles(participant.id);
                              }}
                            >
                              📁 파일 보기 ({fileCount})
                            </button>
                          ) : (
                            <span className="no-files">파일 없음</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="details-view-btn"
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setShowDetails(true);
                            }}
                          >
                            📋 상세보기
                          </button>
                        </td>
                        <td className="confirmation-cell">
                          <input
                            type="radio"
                            name={`confirmation_${participant.id}`}
                            value="approved"
                            checked={participant.confirmation_status === 'approved'}
                            onChange={() => handleConfirmationChange(participant.id, 'approved')}
                            className="confirmation-radio"
                          />
                        </td>
                        <td className="confirmation-cell">
                          <input
                            type="radio"
                            name={`confirmation_${participant.id}`}
                            value="rejected"
                            checked={participant.confirmation_status === 'rejected'}
                            onChange={() => handleConfirmationChange(participant.id, 'rejected')}
                            className="confirmation-radio"
                          />
                        </td>
                      </tr>
                    );
                  })
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
                className="download-all-btn"
                onClick={() => downloadAllFiles(selectedParticipant)}
              >
                📦 전체 다운로드 (ZIP)
              </button>
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

      {/* 상세 정보 모달 */}
      {showDetails && selectedParticipant && renderDetailsModal()}
    </div>
  );
};

export default AdminPage;
