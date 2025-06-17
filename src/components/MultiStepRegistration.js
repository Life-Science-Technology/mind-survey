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
    experimentParticipation: false,
    dataUsage: false,
    thirdParty: false
  });
  
  // 개인정보 입력 관련 상태
  const [userData, setUserData] = useState({
    ...initialUserData,
    address: '',
    detailedAddress: '',
    gender: '',
    birthDate: '',
    signatureName: ''
  });
  const [emailError, setEmailError] = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // 파일 업로드 관련 상태
  const [files, setFiles] = useState({
    idCard: null,
    bankAccount: null,
    consentForm: null
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
  const getGroupType = () => {
    if (depressionScore >= 10) {
      return 'depression';
    } else if (stressScore >= 17) {
      return 'stress';
    } else {
      return 'normal';
    }
  };

  // 체크박스 상태 변경 핸들러
  const handleConsentChange = (e) => {
    const { name, checked } = e.target;
    setConsentChecked(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // 필수 동의 항목 확인 함수
  const isConsentValid = () => {
    return consentChecked.personalInfo;
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
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    if (!validateFileType(file, allowedTypes)) {
      setRegistrationError('지원하지 않는 파일 형식입니다. 이미지 파일(JPG, PNG, GIF) 또는 문서 파일(PDF, HWP, DOC)을 업로드해주세요.');
      return;
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
    setCurrentStep(prev => Math.min(prev + 1, 4));
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
    if (!consentChecked.experimentParticipation || !consentChecked.dataUsage) {
      setRegistrationError('필수 동의 항목에 동의해주세요.');
      return;
    }

    setRegistrationError('');
    nextStep();
  };

  // 3단계: 상세 개인정보 입력
  const handleStep3Submit = () => {
    if (!userData.address || !userData.gender || !userData.birthDate || !userData.signatureName) {
      setRegistrationError('모든 필수 정보를 입력해주세요.');
      return;
    }

    setRegistrationError('');
    nextStep();
  };

  // 4단계: 파일 업로드 및 최종 등록
  const handleFinalSubmit = async () => {
    if (!files.idCard || !files.bankAccount) {
      setRegistrationError('신분증과 통장 사본을 업로드해주세요.');
      return;
    }

    try {
      setIsRegistering(true);
      setIsUploading(true);
      setRegistrationError('');

      // 먼저 사용자 데이터 저장
      const { data: insertedUser, error: userError } = await supabase
        .from('survey-person')
        .insert([
          { 
            name: userData.name, 
            email: userData.email, 
            phone: userData.phone, 
            address: userData.address,
            detailed_address: userData.detailedAddress,
            gender: userData.gender,
            birth_date: userData.birthDate,
            signature_name: userData.signatureName,
            consent_date: new Date().toISOString().split('T')[0],
            registration_step: 4,
            experiment_consent: consentChecked.experimentParticipation,
            data_usage_consent: consentChecked.dataUsage,
            third_party_consent: consentChecked.thirdParty,
            depressive: depressionScore,
            anxiety: anxietyScore,
            stress: stressScore,
          }
        ])
        .select()
        .single();

      if (userError) {
        throw new Error(`사용자 데이터 저장 오류: ${userError.message}`);
      }

      const participantId = insertedUser.id;

      // 파일 업로드
      const fileUploads = [];
      
      if (files.idCard) {
        const idCardPath = await uploadFileToStorage(files.idCard, `idcard_${participantId}`, 'idCard');
        fileUploads.push({
          participant_id: participantId,
          file_type: 'identity_card',
          file_name: files.idCard.name,
          file_path: idCardPath,
          file_size: files.idCard.size
        });
      }

      if (files.bankAccount) {
        const bankPath = await uploadFileToStorage(files.bankAccount, `bankaccount_${participantId}`, 'bankAccount');
        fileUploads.push({
          participant_id: participantId,
          file_type: 'bank_account',
          file_name: files.bankAccount.name,
          file_path: bankPath,
          file_size: files.bankAccount.size
        });
      }

      if (files.consentForm) {
        const consentPath = await uploadFileToStorage(files.consentForm, `consent_${participantId}`, 'consentForm');
        fileUploads.push({
          participant_id: participantId,
          file_type: 'consent_form',
          file_name: files.consentForm.name,
          file_path: consentPath,
          file_size: files.consentForm.size
        });
      }

      // 파일 정보 데이터베이스에 저장
      if (fileUploads.length > 0) {
        const { error: fileError } = await supabase
          .from('uploaded_files')
          .insert(fileUploads);

        if (fileError) {
          throw new Error(`파일 정보 저장 오류: ${fileError.message}`);
        }
      }

      setRegistrationSuccess(true);
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
        <p>귀하는 <strong>
          {getGroupType() === 'depression' ? '우울군' : 
          getGroupType() === 'stress' ? '스트레스 고위험군' : '건강인'}</strong>으로 분류되어 실증 실험 참여가 가능합니다.</p>
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
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. 상세정보</div>
              <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4. 서류제출</div>
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
                    <p>서명은 직접 <span style={{color: 'red'}}>업로드</span> 해주시거나 <span style={{color: 'blue'}}>가족, 메일, 문자</span>로 보내주셔도 됩니다.</p>
                    <p>입력된 개인 정보는 연구원 확인 후 즉시 모두 <strong>폐기</strong>됩니다.</p>
                  </div>

                  <div className="consent-details-box">
                    <h6>세부 동의 1</h6>
                    <p>본 연구진행 중 본인에게 영향을 줄 수도 있는 새로운 정보를 연구자가 획득 시 그 내용을 통보 받을 수 있습니다.</p>
                    <label>
                      <input 
                        type="checkbox" 
                        name="experimentParticipation" 
                        checked={consentChecked.experimentParticipation}
                        onChange={handleConsentChange}
                      />
                      동의를 원합니다.
                    </label>
                    <label>
                      <input 
                        type="checkbox" 
                        name="experimentParticipation" 
                        checked={!consentChecked.experimentParticipation}
                        onChange={(e) => setConsentChecked(prev => ({...prev, experimentParticipation: !e.target.checked}))}
                      />
                      동의를 원치 않습니다.
                    </label>
                  </div>

                  <div className="consent-details-box">
                    <h6>세부 동의 2</h6>
                    <p>연구과정에서 취득된 검체 및 자료는 연구목적으로 본 연구 이외에 향후 사용될 수 있습니다.</p>
                    <label>
                      <input 
                        type="checkbox" 
                        name="dataUsage" 
                        checked={consentChecked.dataUsage}
                        onChange={handleConsentChange}
                      />
                      사안 발생 시 본인에게 사용허락을 받기 원합니다.
                    </label>
                    <label>
                      <input 
                        type="checkbox" 
                        name="dataUsage" 
                        checked={!consentChecked.dataUsage}
                        onChange={(e) => setConsentChecked(prev => ({...prev, dataUsage: !e.target.checked}))}
                      />
                      사용을 원치 않습니다.
                    </label>
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

            {/* 3단계: 상세 개인정보 입력 */}
            {currentStep === 3 && (
              <div className="registration-step">
                <h5>3단계: 상세 개인정보 입력</h5>
                
                <div className="form-section">
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
                    <label htmlFor="detailedAddress">상세주소</label>
                    <input 
                      type="text" 
                      id="detailedAddress" 
                      value={userData.detailedAddress || ''}
                      onChange={handleChange}
                      placeholder="상세주소 (선택사항)"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="gender"><strong>성별</strong></label>
                    <select 
                      id="gender" 
                      value={userData.gender || ''}
                      onChange={handleChange}
                      required
                    >
                      <option value="">선택하세요</option>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="birthDate"><strong>생년월일</strong></label>
                    <input 
                      type="date" 
                      id="birthDate" 
                      value={userData.birthDate || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="signatureName"><strong>서명 (이름)</strong></label>
                    <input 
                      type="text" 
                      id="signatureName" 
                      value={userData.signatureName || ''}
                      onChange={handleChange}
                      placeholder="서명할 이름을 입력하세요"
                      required
                    />
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
                    onClick={handleStep3Submit}
                  >
                    다음 단계
                  </button>
                </div>
              </div>
            )}

            {/* 4단계: 서류 제출 */}
            {currentStep === 4 && (
              <div className="registration-step">
                <h5>4단계: 서류 제출</h5>
                
                <div className="document-upload-section">
                  <h6>사례비 지급을 위한 서류 제출</h6>
                  <p>실험에 참여해 주셔서 감사합니다.</p>
                  <p>실험 종료 확인 후,</p>
                  <ol>
                    <li><strong>삼성 헬스 데이터 업로드 (메일 또는 카톡 전송 가능)</strong></li>
                    <li><strong>위치 반납</strong></li>
                    <li><strong>동의서 서명 및 통장 사본, 신분증 사본 전송 (업로드 또는 카톡 등)</strong></li>
                  </ol>
                  <p>이 완료되면 제출하신 서류를 한국과학기술연구원 행정팀에 상신하여 결재가 이루어지면 지급됩니다.</p>
                  <p>행정 절차가 일일적으로 진행되는 부분이 있어, 개인마다 차이가 있으나 통상 실험 완료 후 1주일에서 1달 이내에 등장으로 지급이 이루어집니다.</p>
                  <p>필요한 서류를 제출해 주시면 가능한 빠른 시일 안에 사례비가 지급되도록 하겠습니다.</p>
                  <p>제출하신 파일은 행정팀 제출 위한 연구원 확인 후 즉시 <strong>폐기</strong>되어 사례비 지급용도만 사용됩니다.</p>

                  <div className="file-upload-group">
                    <h6>■ 파일 업로드</h6>
                    
                    <div className="file-upload-item">
                      <label><strong>신분증 사본</strong></label>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.hwp,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'idCard')}
                      />
                      {files.idCard && (
                        <p className="file-info">
                          선택된 파일: {files.idCard.name} ({formatFileSize(files.idCard.size)})
                        </p>
                      )}
                    </div>

                    <div className="file-upload-item">
                      <label><strong>통장 사본</strong></label>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.hwp,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'bankAccount')}
                      />
                      {files.bankAccount && (
                        <p className="file-info">
                          선택된 파일: {files.bankAccount.name} ({formatFileSize(files.bankAccount.size)})
                        </p>
                      )}
                    </div>

                    <div className="file-upload-item">
                      <label>동의서 (선택사항)</label>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.hwp,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'consentForm')}
                      />
                      {files.consentForm && (
                        <p className="file-info">
                          선택된 파일: {files.consentForm.name} ({formatFileSize(files.consentForm.size)})
                        </p>
                      )}
                    </div>

                    <div className="file-upload-note">
                      <p><small>※ 연구자가 입력한 내용을 txt 버전으로 다운로드 받을 수 있으며 좋겠습니다.</small></p>
                    </div>
                  </div>

                  <div className="consent-item">
                    <input 
                      type="checkbox" 
                      id="personalInfo" 
                      name="personalInfo" 
                      checked={consentChecked.personalInfo}
                      onChange={handleConsentChange}
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
                    className={`btn register-btn ${isConsentValid() ? 'active' : 'disabled'}`}
                    onClick={handleFinalSubmit}
                    disabled={isRegistering || isUploading || !isConsentValid()}
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