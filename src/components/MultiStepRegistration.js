import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../supabaseClient';
import { compressImage, formatFileSize, validateFileType, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, shouldCompress } from '../utils/fileCompression';

const MultiStepRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 전달받은 점수 데이터
  const { depressionScore = 0, anxietyScore = 0, stressScore = 0, userData: initialUserData = {} } = location.state || {};
  
  // 상태 관리
  const [currentStep, setCurrentStep] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [consentChecked, setConsentChecked] = useState({
    personalInfo: false,
    experimentParticipation: null, // null: 선택 안함, true: 첫번째 선택, false: 두번째 선택
    dataUsage: null, // null: 선택 안함, true: 첫번째 선택, false: 두번째 선택
    thirdParty: false
  });
  
  // 개인정보 입력 관련 상태
  const [userData, setUserData] = useState({
    ...initialUserData,
    address: '',
    gender: '',
    birthDate: '',
    signatureUploadMethod: '', // 'upload' 또는 'direct'
    idCardUploadMethod: '', // 'upload' 또는 'direct'
    bankAccountUploadMethod: '' // 'upload' 또는 'direct'
  });
  const [emailError, setEmailError] = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // 파일 업로드 관련 상태
  const [files, setFiles] = useState({
    idCard: null,
    bankAccount: null,
    consentForm: null,
    signature: null,
    signatureImage: null
  });
  const [isUploading, setIsUploading] = useState(false);
  


  // 컴포넌트 마운트 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 뒤로가기 핸들러
  const handleBackClick = () => {
    navigate(-1);
  };

  // 집단 분류 함수
  // eslint-disable-next-line no-unused-vars
  const getGroupType = () => {
    if (depressionScore >= 10) {
      return 'depression';
    } else if (stressScore >= 17) {
      return 'stress';
    } else {
      return 'normal';
    }
  };



  // 필수 동의 항목 및 파일 업로드 확인 함수
  // eslint-disable-next-line no-unused-vars
  const isConsentValid = () => {
    return consentChecked.personalInfo;
  };

  // 3단계 등록 완료 버튼 활성화 조건
  const isFinalSubmitValid = () => {
    if (!consentChecked.personalInfo) return false;
    if (!userData.idCardUploadMethod || !userData.bankAccountUploadMethod) return false;
    
    // 업로드 방법을 선택했는데 파일이 없는 경우만 체크
    // 직접 전송 방법을 선택한 경우는 파일이 없어도 됨
    if (userData.idCardUploadMethod === 'upload' && !files.idCard) return false;
    if (userData.bankAccountUploadMethod === 'upload' && !files.bankAccount) return false;
    
    return true;
  };
  
  // 이메일 형식 검증
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // 전화번호 형식 검증
  const validatePhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('010') && digits.length === 11;
  };
  
  // 전화번호 형식화 함수
  const formatPhoneNumber = useCallback((phone) => {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
  }, []);
  
  // 전화번호 초기화
  useEffect(() => {
    if (userData.phone) {
      setPhoneFormatted(formatPhoneNumber(userData.phone));
    }
  }, [userData.phone, formatPhoneNumber]);
  
  // 사용자 데이터 업데이트 함수
  const updateUserData = (newData) => {
    setUserData(prevData => ({
      ...prevData,
      ...newData
    }));
  };
  
  // 이메일 입력 처리
  const handleEmailChange = (e) => {
    const { value } = e.target;
    updateUserData({ email: value });
    
    if (value && !validateEmail(value)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
    } else {
      setEmailError('');
    }
  };
  
  // 전화번호 입력 처리
  const handlePhoneChange = (e) => {
    const { value } = e.target;
    const digits = value.replace(/\D/g, '');
    
    if (digits.length >= 3 && !digits.startsWith('010')) {
      setPhoneError('전화번호는 010으로 시작해야 합니다.');
    } else if (digits.length > 0 && digits.length < 11) {
      setPhoneError('전화번호는 11자리여야 합니다.');
    } else {
      setPhoneError('');
    }
    
    const formatted = formatPhoneNumber(value);
    setPhoneFormatted(formatted);
    updateUserData({ phone: digits });
  };
  
  // 일반 입력 처리
  const handleChange = (e) => {
    const { id, value } = e.target;
    updateUserData({ [id]: value });
  };

  // 파일 처리 함수
  const handleFileChange = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 타입 검증
    let allowedTypes;
    if (fileType === 'signature') {
      allowedTypes = ['application/pdf', 'application/haansofthwp', 'application/x-hwp'];
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.hwp')) {
        setRegistrationError('동의서는 HWP 또는 PDF 파일만 업로드할 수 있습니다.');
        return;
      }
    } else if (fileType === 'signatureImage') {
      allowedTypes = ALLOWED_IMAGE_TYPES;
      if (!validateFileType(file, allowedTypes)) {
        setRegistrationError('서명 이미지는 이미지 파일(JPG, PNG, GIF)만 업로드할 수 있습니다.');
        return;
      }
    } else {
      allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
      if (!validateFileType(file, allowedTypes)) {
        setRegistrationError('지원하지 않는 파일 형식입니다. 이미지 파일(JPG, PNG, GIF) 또는 문서 파일(PDF, HWP, DOC)을 업로드해주세요.');
        return;
      }
    }

    // 파일 크기 검증 (10MB 제한)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setRegistrationError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    try {
      let processedFile = file;
      
      // 이미지인 경우 압축 처리
      if (shouldCompress(file)) {
        setRegistrationError('');
        processedFile = await compressImage(file, 0.8);
        console.log(`파일 압축 완료: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`);
      }

      setFiles(prev => ({
        ...prev,
        [fileType]: processedFile
      }));
      
      setRegistrationError('');
    } catch (error) {
      console.error('파일 처리 오류:', error);
      setRegistrationError('파일 처리 중 오류가 발생했습니다.');
    }
  };

  // Supabase Storage에 파일 업로드
  const uploadFileToStorage = async (file, fileName, fileType) => {
    try {
      const filePath = `documents/${Date.now()}_${fileName}`;
      
      const { error } = await supabase.storage
        .from('participant-files')
        .upload(filePath, file);

      if (error) throw error;

      return filePath;
    } catch (error) {
      console.error(`${fileType} 업로드 오류:`, error);
      throw error;
    }
  };

  // 단계 진행 함수
  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 1단계: 기본 정보 입력
  const handleStep1Submit = async () => {
    if (!userData.name || !userData.email || !userData.phone) {
      setRegistrationError('모든 필수 정보를 입력해주세요.');
      return;
    }
    
    if (!validateEmail(userData.email)) {
      setRegistrationError('유효한 이메일 주소를 입력해주세요.');
      return;
    }
    
    if (!validatePhoneNumber(userData.phone)) {
      setRegistrationError('전화번호는 010으로 시작하는 11자리 번호여야 합니다.');
      return;
    }

    setRegistrationError('');
    nextStep();
  };

  // 2단계: 실험 참여 동의서
  const handleStep2Submit = () => {
    if (consentChecked.experimentParticipation === null || consentChecked.dataUsage === null) {
      setRegistrationError('세부 동의 항목을 선택해주세요.');
      return;
    }


    // 2단계에 추가된 상세정보 필드 유효성 검사
    if (!userData.address || !userData.gender || !userData.birthDate) {
      setRegistrationError('주소, 성별, 생년월일을 모두 입력해주세요.');
      return;
    }

    if (!userData.signatureUploadMethod) {
      setRegistrationError('서명 제출 방법을 선택해주세요.');
      return;
    }

    if (userData.signatureUploadMethod === 'upload' && !files.signatureImage) {
      setRegistrationError('서명 이미지를 업로드해주세요.');
      return;
    }

    setRegistrationError('');
    setCurrentStep(3); // 바로 3단계(서류제출)로 이동
  };

  // 파일 업로드 처리 함수 (리팩토링)
  const processFileUploads = async (participantId) => {
    const fileUploads = [];
    const uploadErrors = [];
    const directSubmissions = []; // 직접 전송 방법으로 선택된 파일들 추적

    // 업로드 파일 처리 헬퍼 함수
    const uploadFile = async (file, fileName, fileType, uploadMethod = 'upload') => {
      if (uploadMethod === 'upload' && file) {
        try {
          console.log(`${fileType} 파일 업로드 시작:`, file.name);
          const filePath = await uploadFileToStorage(file, fileName, fileType);
          console.log(`${fileType} 파일 업로드 성공:`, filePath);
          return {
            participant_id: participantId,
            file_type: fileType === 'idCard' ? 'identity_card' : 
                      fileType === 'bankAccount' ? 'bank_account' :
                      fileType === 'signatureImage' ? 'signature_image' :
                      fileType,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size
          };
        } catch (error) {
          console.error(`${fileType} 파일 업로드 오류:`, error);
          uploadErrors.push(`${fileType} 파일 업로드 실패: ${error.message}`);
          return null;
        }
      }
      return null;
    };

    // 직접 전송 추적 헬퍼 함수
    const trackDirectSubmission = (fileType, typeName) => {
      console.log(`${typeName} 직접 전송 방법 선택됨 - 데이터베이스 저장 제외`);
      directSubmissions.push({ fileType, typeName });
    };

    // 신분증 처리
    if (userData.idCardUploadMethod === 'upload') {
      const uploadResult = await uploadFile(files.idCard, `idcard_${participantId}`, 'idCard');
      if (uploadResult) fileUploads.push(uploadResult);
    } else if (userData.idCardUploadMethod === 'direct') {
      trackDirectSubmission('identity_card', '신분증');
    }

    // 통장 처리
    if (userData.bankAccountUploadMethod === 'upload') {
      const uploadResult = await uploadFile(files.bankAccount, `bankaccount_${participantId}`, 'bankAccount');
      if (uploadResult) fileUploads.push(uploadResult);
    } else if (userData.bankAccountUploadMethod === 'direct') {
      trackDirectSubmission('bank_account', '통장');
    }

    // 서명 이미지 처리
    if (userData.signatureUploadMethod === 'upload') {
      const uploadResult = await uploadFile(files.signatureImage, `signature_image_${participantId}`, 'signatureImage');
      if (uploadResult) fileUploads.push(uploadResult);
    } else if (userData.signatureUploadMethod === 'direct') {
      trackDirectSubmission('signature_image', '서명');
    }

    // 기타 파일들 (항상 업로드 방식)
    if (files.consentForm) {
      const uploadResult = await uploadFile(files.consentForm, `consent_${participantId}`, 'consent_form');
      if (uploadResult) fileUploads.push(uploadResult);
    }

    if (files.signature) {
      const uploadResult = await uploadFile(files.signature, `signature_${participantId}`, 'signature');
      if (uploadResult) fileUploads.push(uploadResult);
    }

    return { fileUploads, uploadErrors, directSubmissions };
  };

  // 3단계: 파일 업로드 및 최종 등록
  const handleFinalSubmit = async () => {
    // 신분증 제출 방법 검증
    if (!userData.idCardUploadMethod) {
      setRegistrationError('신분증 제출 방법을 선택해주세요.');
      return;
    }
    
    // 업로드 방법을 선택했는데 파일이 없는 경우만 체크 (직접 전송 방법은 제외)
    if (userData.idCardUploadMethod === 'upload' && !files.idCard) {
      setRegistrationError('신분증 사본 파일을 업로드해주세요.');
      return;
    }
    
    // 통장 제출 방법 검증
    if (!userData.bankAccountUploadMethod) {
      setRegistrationError('통장 사본 제출 방법을 선택해주세요.');
      return;
    }
    
    // 업로드 방법을 선택했는데 파일이 없는 경우만 체크 (직접 전송 방법은 제외)
    if (userData.bankAccountUploadMethod === 'upload' && !files.bankAccount) {
      setRegistrationError('통장 사본 파일을 업로드해주세요.');
      return;
    }

    try {
      setIsRegistering(true);
      setIsUploading(true);
      setRegistrationError('');

      // 먼저 사용자 데이터 저장
      console.log('사용자 데이터 저장 시도:', {
        name: userData.name, 
        email: userData.email, 
        phone: userData.phone, 
        address: userData.address,
        gender: userData.gender,
        birth_date: userData.birthDate,
        signature_upload_method: userData.signatureUploadMethod,
        id_card_upload_method: userData.idCardUploadMethod,
        bank_account_upload_method: userData.bankAccountUploadMethod,
        consent_date: new Date().toISOString().split('T')[0],
        registration_step: 3,
        experiment_consent: consentChecked.experimentParticipation === true,
        data_usage_consent: consentChecked.dataUsage === true,
        third_party_consent: consentChecked.thirdParty,
        depressive: depressionScore,
        anxiety: anxietyScore,
        stress: stressScore,
      });

      const { data: insertedUser, error: userError } = await supabase
        .from('survey-person')
        .insert([
          { 
            name: userData.name, 
            email: userData.email, 
            phone: userData.phone, 
            address: userData.address,
            gender: userData.gender,
            birth_date: userData.birthDate,
            signature_upload_method: userData.signatureUploadMethod,
            id_card_upload_method: userData.idCardUploadMethod,
            bank_account_upload_method: userData.bankAccountUploadMethod,
            consent_date: new Date().toISOString().split('T')[0],
            registration_step: 3,
            experiment_consent: consentChecked.experimentParticipation === true,
            data_usage_consent: consentChecked.dataUsage === true,
            third_party_consent: consentChecked.thirdParty,
            depressive: depressionScore,
            anxiety: anxietyScore,
            stress: stressScore,
          }
        ])
        .select()
        .single();

      if (userError) {
        console.error('사용자 데이터 저장 상세 오류:', userError);
        throw new Error(`사용자 데이터 저장 오류: ${userError.message}`);
      }

      console.log('사용자 데이터 저장 성공:', insertedUser);

      const participantId = insertedUser.id;

      // 파일 업로드 처리 (리팩토링된 함수 사용)
      const { fileUploads, uploadErrors, directSubmissions } = await processFileUploads(participantId);

      // 업로드 오류가 있는 경우 경고 로그 출력
      if (uploadErrors.length > 0) {
        console.warn('파일 업로드 중 일부 오류 발생:', uploadErrors);
      }

      // 직접 전송으로 선택된 파일들 로그 기록
      if (directSubmissions.length > 0) {
        console.log('직접 전송으로 선택된 파일들:', directSubmissions.map(item => item.typeName).join(', '));
      }

      // 파일 정보 데이터베이스에 저장 (실제 업로드된 파일이 있는 경우만)
      if (fileUploads.length > 0) {
        console.log('파일 정보 저장 시도:', fileUploads);
        const { error: fileError } = await supabase
          .from('uploaded_files')
          .insert(fileUploads);

        if (fileError) {
          console.error('파일 정보 저장 상세 오류:', fileError);
          throw new Error(`파일 정보 저장 오류: ${fileError.message}`);
        }
        console.log('파일 정보 저장 성공');
      } else {
        console.log('실제 업로드된 파일이 없어 파일 정보 저장을 건너뜁니다.');
      }

      // 등록 성공 처리
      setRegistrationSuccess(true);
      
      // 상황별 로그 기록
      if (uploadErrors.length > 0) {
        console.log('등록은 완료되었지만 일부 파일 업로드에 실패했습니다:', uploadErrors);
      }
      
      if (directSubmissions.length > 0) {
        console.log(`등록 완료 - 직접 전송 예정 파일: ${directSubmissions.map(item => item.typeName).join(', ')}`);
      }
    } catch (error) {
      console.error('최종 등록 오류:', error);
      setRegistrationError(`등록 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsRegistering(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="data-collection-guide">
      <div className="guide-header">
        <h1>실증 실험 참여 대기자 등록</h1>
      </div>
      
      <div className="guide-content">
        {registrationSuccess ? (
          <div className="registration-success-box">
            <h3>등록이 완료되었습니다!</h3>
            <p>실증 실험 대기자로 등록되었습니다.</p>
            <p>담당자가 곧 연락드릴 예정입니다. 감사합니다.</p>
            <div className="step-actions">
              <button 
                type="button" 
                className="btn back-btn"
                onClick={handleBackClick}
              >
                돌아가기
              </button>
            </div>
          </div>
        ) : (
          <div className="multi-step-registration">
            {/* 진행 상태 표시 */}
            <div className="step-indicator">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. 기본정보</div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. 동의서</div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. 서류제출</div>
            </div>

            {/* 1단계: 기본 정보 입력 */}
            {currentStep === 1 && (
              <div className="registration-step">
                <h5>1단계: 기본 정보 입력</h5>
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="name"><strong>이름</strong></label>
                    <input 
                      type="text" 
                      id="name" 
                      value={userData.name || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email"><strong>이메일</strong></label>
                    <input 
                      type="email" 
                      id="email" 
                      value={userData.email || ''}
                      onChange={handleEmailChange}
                      required
                      className={emailError ? 'input-error' : ''}
                    />
                    {emailError && <p className="error-message">{emailError}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone"><strong>전화번호</strong></label>
                    <input 
                      type="tel" 
                      id="phone" 
                      value={phoneFormatted}
                      onChange={handlePhoneChange}
                      placeholder="010-0000-0000"
                      required
                      className={phoneError ? 'input-error' : ''}
                    />
                    {phoneError ? (
                      <p className="error-message">{phoneError}</p>
                    ) : (
                      <p className="helper-text">형식: 010-0000-0000</p>
                    )}
                  </div>
                </div>

                {registrationError && (
                  <p className="error-message">{registrationError}</p>
                )}

                <div className="step-actions">
                  <button 
                    type="button" 
                    className="btn prev-btn"
                    onClick={handleBackClick}
                  >
                    돌아가기
                  </button>
                  <button 
                    type="button" 
                    className="btn next-btn"
                    onClick={handleStep1Submit}
                  >
                    다음 단계
                  </button>
                </div>
              </div>
            )}

            {/* 2단계: 실험 참여 동의서 */}
            {currentStep === 2 && (
              <div className="registration-step">
                <h5>2단계: 실험 참여 동의서</h5>
                
                <div className="consent-document">
                  <h6>실험 참여 동의 안내</h6>
                  <div className="consent-content">
                    <p>아래 동의서를 읽어 보시고,</p>
                    <p>실험 참여에 동의하시면 세부 동의 1, 2에 체크하신 후</p>
                    <p><strong>주소 (동까지만), 연락처, 성명, 서명, 동의일자</strong>를 입력해 주세요.</p>
                    <p>서명은 직접 <span style={{color: 'red'}}>업로드</span> 해주시거나 <span style={{color: 'blue'}}>카톡, 메일, 문자</span>로 보내주셔도 됩니다.</p>
                    <p>입력된 개인 정보는 연구원 확인 후 즉시 모두 <strong>폐기</strong>됩니다.</p>
                  </div>

                  <div className="consent-details-box">
                    <h6>실험 참여 동의서</h6>
                    
                    <div className="download-section">
                      <div className="consent-buttons">
                        <button 
                          type="button" 
                          className="btn download-btn"
                          onClick={async () => {
                            try {
                              const fileName = '피험자동의서_2025.zip';
                              const baseUrl = process.env.PUBLIC_URL || window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
                              
                              // 여러 경로를 시도
                              const possiblePaths = [
                                `${baseUrl}/${encodeURIComponent(fileName)}`,
                                `${window.location.origin}${process.env.PUBLIC_URL || ''}/${encodeURIComponent(fileName)}`,
                                `./${encodeURIComponent(fileName)}`,
                                `/${encodeURIComponent(fileName)}`
                              ];
                              
                              let response = null;
                              let lastError = null;
                              
                              for (const path of possiblePaths) {
                                try {
                                  console.log('시도하는 경로:', path);
                                  response = await fetch(path);
                                  if (response.ok) {
                                    console.log('성공한 경로:', path);
                                    break;
                                  }
                                } catch (error) {
                                  lastError = error;
                                  console.log('실패한 경로:', path, error);
                                }
                              }
                              
                              if (!response || !response.ok) {
                                throw new Error(`파일을 찾을 수 없습니다. 상태: ${response?.status || 'unknown'}`);
                              }
                              
                              const blob = await response.blob();
                              
                              // Blob URL을 생성하여 다운로드
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = fileName;
                              link.style.display = 'none';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              // 메모리 정리
                              window.URL.revokeObjectURL(url);
                              
                            } catch (error) {
                              console.error('파일 다운로드 중 오류 발생:', error);
                              alert(`파일 다운로드에 실패했습니다: ${error.message}\n네트워크 연결을 확인하고 다시 시도해주세요.`);
                            }
                          }}
                        >
                          📁 실험 참여 동의서 다운로드 (ZIP)
                        </button>
                      </div>
                      
                      {/* 인라인 PDF 뷰어 - 항상 표시 */}
                      <div className="inline-pdf-viewer">
                        <div className="pdf-viewer-header">
                          <h6>피험자동의서</h6>
                        </div>
                        <div className="pdf-iframe-container">
                          <iframe 
                            src={`${process.env.PUBLIC_URL || ''}/피험자동의서.pdf`}
                            width="100%"
                            height="500"
                            title="피험자동의서"
                            style={{
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          >
                            <p>PDF를 표시할 수 없습니다. <a href={`${process.env.PUBLIC_URL || ''}/피험자동의서.pdf`} target="_blank" rel="noopener noreferrer">여기를 클릭하여 PDF를 확인하세요.</a></p>
                          </iframe>
                        </div>
                      </div>
                    </div>


                  </div>

                  <div className="consent-details-box">
                    <h6>세부 동의 1</h6>
                    <p>본 연구진행 중 본인에게 영향을 줄 수도 있는 새로운 정보를 연구자가 획득 시 그 내용을 통보 받을 수 있습니다.</p>
                    <label>
                      <input 
                        type="checkbox" 
                        name="experimentParticipation" 
                        checked={consentChecked.experimentParticipation === true}
                        onChange={() => setConsentChecked(prev => ({...prev, experimentParticipation: prev.experimentParticipation === true ? null : true}))}
                      />
                      통보를 원합니다.
                    </label>
                    <label>
                      <input 
                        type="checkbox" 
                        name="experimentParticipation" 
                        checked={consentChecked.experimentParticipation === false}
                        onChange={() => setConsentChecked(prev => ({...prev, experimentParticipation: prev.experimentParticipation === false ? null : false}))}
                      />
                      통보를 원치 않습니다.
                    </label>
                  </div>

                  <div className="consent-details-box">
                    <h6>세부 동의 2</h6>
                    <p>연구과정에서 채취된 검체 및 자료는 연구목적으로 본 연구 이외에도 향후 사용될 수 있습니다.</p>
                    <label>
                      <input 
                        type="checkbox" 
                        name="dataUsage" 
                        checked={consentChecked.dataUsage === true}
                        onChange={() => setConsentChecked(prev => ({...prev, dataUsage: prev.dataUsage === true ? null : true}))}
                      />
                      사안 발생 시 본인에게 사용허락을 받기 원합니다.
                    </label>
                    <label>
                      <input 
                        type="checkbox" 
                        name="dataUsage" 
                        checked={consentChecked.dataUsage === false}
                        onChange={() => setConsentChecked(prev => ({...prev, dataUsage: prev.dataUsage === false ? null : false}))}
                      />
                      사용을 원치 않습니다.
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address"><strong>주소 (동까지만)</strong></label>
                    <input 
                      type="text" 
                      id="address" 
                      value={userData.address || ''}
                      onChange={handleChange}
                      placeholder="예: 서울시 강남구 역삼동"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="gender"><strong>성별</strong></label>
                    <div className="gender-options">
                      <label className="radio-option">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="male" 
                          checked={userData.gender === 'male'}
                          onChange={(e) => updateUserData({ gender: e.target.value })}
                          required
                        />
                        <span className="radio-custom"></span>
                        남성
                      </label>
                      <label className="radio-option">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="female" 
                          checked={userData.gender === 'female'}
                          onChange={(e) => updateUserData({ gender: e.target.value })}
                          required
                        />
                        <span className="radio-custom"></span>
                        여성
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="birthDate"><strong>생년월일</strong></label>
                    <input 
                      type="date" 
                      id="birthDate" 
                      value={userData.birthDate || ''}
                      onChange={handleChange}
                      className="date-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label><strong>서명 제출 방법 선택 *</strong></label>
                    
                    <div className="signature-method-options">
                      <label className="radio-option">
                        <input 
                          type="radio" 
                          name="signatureUploadMethod" 
                          value="upload" 
                          checked={userData.signatureUploadMethod === 'upload'}
                          onChange={(e) => updateUserData({ signatureUploadMethod: e.target.value })}
                          required
                        />
                        <span className="radio-custom"></span>
                        서명 이미지 업로드
                      </label>
                      <label className="radio-option">
                        <input 
                          type="radio" 
                          name="signatureUploadMethod" 
                          value="direct" 
                          checked={userData.signatureUploadMethod === 'direct'}
                          onChange={(e) => updateUserData({ signatureUploadMethod: e.target.value })}
                          required
                        />
                        <span className="radio-custom"></span>
                        이미지 직접 전송 (카톡, 메일 등)
                      </label>
                    </div>

                    {userData.signatureUploadMethod === 'upload' && (
                      <div className="file-upload-item" style={{ marginTop: '15px' }}>
                        <label>서명 이미지 파일</label>
                        <input 
                          type="file" 
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'signatureImage')}
                        />
                        {files.signatureImage && (
                          <p className="file-info">
                            선택된 파일: {files.signatureImage.name} ({formatFileSize(files.signatureImage.size)})
                          </p>
                        )}
                        <p className="helper-text">이미지 파일(JPG, JPEG, PNG)만 업로드 가능합니다.</p>
                      </div>
                    )}

                    {userData.signatureUploadMethod === 'direct' && (
                      <div className="direct-submission-info" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9ff', borderRadius: '8px', border: '1px solid #e6ecff' }}>
                        <p><strong>직접 전송 안내:</strong></p>
                        <p>서명 이미지를 카카오톡, 이메일 등을 통해 직접 전송하시면 됩니다.</p>
                        <p>연구팀에서 별도로 연락드릴 예정입니다.</p>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>동의일자</label>
                    <input 
                      type="text" 
                      value={new Date().toLocaleDateString('ko-KR')}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                </div>

                {registrationError && (
                  <p className="error-message">{registrationError}</p>
                )}

                <div className="step-actions">
                  <button 
                    type="button" 
                    className="btn prev-btn"
                    onClick={prevStep}
                  >
                    이전 단계
                  </button>
                  <button 
                    type="button" 
                    className="btn next-btn"
                    onClick={handleStep2Submit}
                  >
                    다음 단계
                  </button>
                </div>
              </div>
            )}



            {/* 3단계: 서류 제출 */}
            {currentStep === 3 && (
              <div className="registration-step">
                <h5>3단계: 서류 제출</h5>
                
                <div className="document-upload-section">
                  <h6>사례비 지급을 위한 서류 제출</h6>
                  <p>실험에 참여해 주셔서 감사합니다.</p>
                  <p>실험 종료 확인 후,</p>
                  <ol>
                    <li><strong>삼성 헬스 데이터 업로드 (메일 또는 카톡 전송 가능)</strong></li>
                    <li><strong>워치 반납</strong></li>
                    <li><strong>동의서 서명 및 통장 사본, 신분증 사본 전송 (업로드 또는 카톡 등)</strong></li>
                  </ol>
                  <p>이 완료되면 제출하신 서류를 한국과학기술연구원 행정팀에 상신하여 결재가 이루어지면 지급됩니다.</p>
                  <p>행정 절차가 일괄적으로 진행되는 부분이 있어, 개인마다 차이가 있으나 통상 <strong>실험 완료 후 1주일에서 1달 이내에</strong> 통장으로 지급이 이루어집니다.</p>
                  <p>필요한 서류를 제출해 주시면 가능한 빠른 시일 안에 사례비가 지급되도록 하겠습니다.</p>
                  <p>제출하신 파일은 행정팀 제출 위한 연구원 확인 후 즉시 <strong>폐기</strong>되어 사례비 지급용도만 사용됩니다.</p>

                  <div className="file-upload-group">
                    <h6>■ 파일 업로드</h6>
                    
                    <div className="form-group">
                      <label><strong>신분증 사본 제출 방법 선택 *</strong></label>
                      
                      <div className="signature-method-options">
                        <label className="radio-option">
                          <input 
                            type="radio" 
                            name="idCardUploadMethod" 
                            value="upload" 
                            checked={userData.idCardUploadMethod === 'upload'}
                            onChange={(e) => updateUserData({ idCardUploadMethod: e.target.value })}
                            required
                          />
                          <span className="radio-custom"></span>
                          이미지 업로드
                        </label>
                        <label className="radio-option">
                          <input 
                            type="radio" 
                            name="idCardUploadMethod" 
                            value="direct" 
                            checked={userData.idCardUploadMethod === 'direct'}
                            onChange={(e) => updateUserData({ idCardUploadMethod: e.target.value })}
                            required
                          />
                          <span className="radio-custom"></span>
                          이미지 직접 전송 (카톡, 메일 등)
                        </label>
                      </div>

                      {userData.idCardUploadMethod === 'upload' && (
                        <div className="file-upload-item" style={{ marginTop: '15px' }}>
                          <label>신분증 사본 파일</label>
                          <input 
                            type="file" 
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'idCard')}
                          />
                          {files.idCard && (
                            <p className="file-info">
                              선택된 파일: {files.idCard.name} ({formatFileSize(files.idCard.size)})
                            </p>
                          )}
                          <p className="helper-text">이미지 파일(JPG, JPEG, PNG)만 업로드 가능합니다.</p>
                        </div>
                      )}

                      {userData.idCardUploadMethod === 'direct' && (
                        <div className="direct-submission-info" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9ff', borderRadius: '8px', border: '1px solid #e6ecff' }}>
                          <p><strong>직접 전송 안내:</strong></p>
                          <p>신분증 사본 이미지를 카카오톡, 이메일 등을 통해 직접 전송하시면 됩니다.</p>
                          <p>연구팀에서 별도로 연락드릴 예정입니다.</p>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label><strong>통장 사본 제출 방법 선택 *</strong></label>
                      
                      <div className="signature-method-options">
                        <label className="radio-option">
                          <input 
                            type="radio" 
                            name="bankAccountUploadMethod" 
                            value="upload" 
                            checked={userData.bankAccountUploadMethod === 'upload'}
                            onChange={(e) => updateUserData({ bankAccountUploadMethod: e.target.value })}
                            required
                          />
                          <span className="radio-custom"></span>
                          이미지 업로드
                        </label>
                        <label className="radio-option">
                          <input 
                            type="radio" 
                            name="bankAccountUploadMethod" 
                            value="direct" 
                            checked={userData.bankAccountUploadMethod === 'direct'}
                            onChange={(e) => updateUserData({ bankAccountUploadMethod: e.target.value })}
                            required
                          />
                          <span className="radio-custom"></span>
                          이미지 직접 전송 (카톡, 메일 등)
                        </label>
                      </div>

                      {userData.bankAccountUploadMethod === 'upload' && (
                        <div className="file-upload-item" style={{ marginTop: '15px' }}>
                          <label>통장 사본 파일</label>
                          <input 
                            type="file" 
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'bankAccount')}
                          />
                          {files.bankAccount && (
                            <p className="file-info">
                              선택된 파일: {files.bankAccount.name} ({formatFileSize(files.bankAccount.size)})
                            </p>
                          )}
                          <p className="helper-text">이미지 파일(JPG, JPEG, PNG)만 업로드 가능합니다.</p>
                        </div>
                      )}

                      {userData.bankAccountUploadMethod === 'direct' && (
                        <div className="direct-submission-info" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9ff', borderRadius: '8px', border: '1px solid #e6ecff' }}>
                          <p><strong>직접 전송 안내:</strong></p>
                          <p>통장 사본 이미지를 카카오톡, 이메일 등을 통해 직접 전송하시면 됩니다.</p>
                          <p>연구팀에서 별도로 연락드릴 예정입니다.</p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* 제출 파일 예시 */}
                  <div className="file-examples-section" style={{ marginTop: '30px', marginBottom: '30px' }}>
                    <h6 style={{ marginBottom: '20px', color: '#2c3e50' }}>제출 파일 예시</h6>
                    
                    <style>
                      {`
                        .examples-grid {
                          display: grid;
                          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                          gap: 15px;
                          margin-bottom: 20px;
                        }
                        .example-image-container {
                          border: 1px solid #dee2e6;
                          border-radius: 8px;
                          overflow: hidden;
                          background-color: white;
                          height: 150px;
                        }
                        @media (max-width: 768px) {
                          .examples-grid {
                            grid-template-columns: 1fr;
                            gap: 20px;
                          }
                          .example-image-container {
                            height: 200px;
                          }
                        }
                      `}
                    </style>
                    
                    <div className="examples-grid">
                      {/* 신분증 사본 예시 */}
                      <div className="example-item" style={{
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        textAlign: 'center',
                        maxWidth: '100%'
                      }}>
                        <h6 style={{ marginBottom: '15px', color: '#495057', fontSize: '14px' }}>신분증 사본</h6>
                        <div className="example-image-container">
                          <img 
                            src={`${process.env.PUBLIC_URL || ''}/신분증 사본 1.png`}
                            alt="신분증 사본 예시"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      </div>

                      {/* 통장 사본 예시 1 */}
                      <div className="example-item" style={{
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        textAlign: 'center',
                        maxWidth: '100%'
                      }}>
                        <h6 style={{ marginBottom: '15px', color: '#495057', fontSize: '14px' }}>통장 사본 (통장 사진)</h6>
                        <div className="example-image-container">
                          <img 
                            src={`${process.env.PUBLIC_URL || ''}/통장사본1.png`}
                            alt="통장 사본 예시 1"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      </div>

                      {/* 통장 사본 예시 2 */}
                      <div className="example-item" style={{
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        textAlign: 'center',
                        maxWidth: '100%'
                      }}>
                        <h6 style={{ marginBottom: '15px', color: '#495057', fontSize: '14px' }}>통장 사본 (출력물)</h6>
                        <div className="example-image-container">
                          <img 
                            src={`${process.env.PUBLIC_URL || ''}/통장사본2.png`}
                            alt="통장 사본 예시 2"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="consent-item">
                    <input 
                      type="checkbox" 
                      id="personalInfo" 
                      name="personalInfo" 
                      checked={consentChecked.personalInfo}
                      onChange={(e) => setConsentChecked(prev => ({...prev, personalInfo: e.target.checked}))}
                    />
                    <label htmlFor="personalInfo">
                      <strong>[필수]</strong> 개인정보 수집 및 이용에 동의합니다.
                    </label>
                    <div className="consent-details">
                      <ul>
                        <li>개인 정보 수집 항목: 이름, 성별, 휴대폰 번호, 이메일 주소, 주소, 생년월일, 신분증, 통장사본</li>
                        <li>수집 목적: 실험 참여 확인 및 사례비 지급</li>
                        <li>보유기간: 사례비 지급 완료 후 즉시 폐기</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {registrationError && (
                  <p className="error-message">{registrationError}</p>
                )}

                <div className="step-actions">
                  <button 
                    type="button" 
                    className="btn prev-btn"
                    onClick={prevStep}
                  >
                    이전 단계
                  </button>
                  <button 
                    type="button" 
                    className={`btn register-btn ${isFinalSubmitValid() ? 'active' : 'disabled'}`}
                    onClick={handleFinalSubmit}
                    disabled={isRegistering || isUploading || !isFinalSubmitValid()}
                  >
                    {isRegistering ? (isUploading ? '파일 업로드 중...' : '등록 중...') : '실증 실험 대기자 등록 완료'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      

    </div>
  );
};

export default MultiStepRegistration; 