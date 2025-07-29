import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase, { ensureUserSession } from '../supabaseClient';
import { compressImage, formatFileSize, validateFileType, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, shouldCompress } from '../utils/fileCompression';
import { REGISTRATION_STEPS } from '../config/registrationSteps';
import { validatePhoneNumber, usePhoneNumber } from '../utils/phoneNumberUtils';
import SignatureCanvas from 'react-signature-canvas';

const MultiStepRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 전달받은 점수 데이터 (3단계에서는 점수를 업데이트하지 않으므로 depressionScore만 집단 분류용으로 사용)
  const { depressionScore = 0, stressScore = 0, userData: initialUserData = {} } = location.state || {};
  
  // 상태 관리
  const [currentStep, setCurrentStep] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [existingUserId, setExistingUserId] = useState(null); // 1단계에서 가져온 기존 사용자 ID
  const [step1State, setStep1State] = useState('namePhone'); // 'namePhone', 'email', 'address'
  const [foundUser, setFoundUser] = useState(null); // DB에서 찾은 사용자 정보
  const [isEditMode, setIsEditMode] = useState(false); // 수정 모드 상태 추가
  const [consentChecked, setConsentChecked] = useState({
    personalInfo: false,
    experimentParticipation: null, // null: 선택 안함, true: 첫번째 선택, false: 두번째 선택
    dataUsage: null, // null: 선택 안함, true: 첫번째 선택, false: 두번째 선택
    thirdParty: false
  });
  
  // 주소 연동 상태 관리
  const [useWatchAddressForResidence, setUseWatchAddressForResidence] = useState(false);
  
  // 개인정보 입력 관련 상태
  const [userData, setUserData] = useState({
    ...initialUserData,
    address: '',
    gender: '',
    birthDate: '',
    department: '', // 근무 소속부서 추가
    idCardUploadMethod: '', // 'upload' 또는 'direct'
    bankAccountUploadMethod: '' // 'upload' 또는 'direct'
  });
  // const [emailError, setEmailError] = useState(''); // 이메일 기능 비활성화로 주석 처리
  
  // 전화번호 관리 (커스텀 훅 사용)
  const {
    phoneFormatted,
    phoneError,
    handlePhoneChange: handlePhoneInputChange
  } = usePhoneNumber(userData.phone, (phone) => updateUserData({ phone }));
  
  // 파일 업로드 관련 상태
  const [files, setFiles] = useState({
    idCard: null,
    bankAccount: null,
    consentForm: null,
    signature: null,
    signatureImage: null
  });
  const [isUploading, setIsUploading] = useState(false);
  
  // 서명 패드 관련 상태
  const signatureRef = useRef(null);
  const [signatureData, setSignatureData] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 });
  


  // 컴포넌트 마운트 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 캔버스 크기 설정 (반응형)
  useEffect(() => {
    const updateCanvasSize = () => {
      // 부모 컨테이너의 실제 너비를 기준으로 계산
      const containerElement = document.querySelector('.signature-pad-container');
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const availableWidth = containerRect.width - 60; // 패딩 30px * 2
        
        // 비율 기반으로 높이 계산 (16:9 비율 정도)
        const aspectRatio = 2.5; // 가로:세로 비율
        const height = Math.max(120, availableWidth / aspectRatio); // 최소 높이 120px
        
        setCanvasSize({
          width: Math.max(200, availableWidth), // 최소 너비 200px
          height: Math.min(200, height) // 최대 높이 200px
        });
      } else {
        // fallback 크기
        const isMobile = window.innerWidth <= 768;
        setCanvasSize({
          width: isMobile ? 250 : 350,
          height: isMobile ? 100 : 140
        });
      }
    };

    // 초기 로드시 약간의 지연을 두어 DOM이 완전히 렌더링된 후 크기 계산
    setTimeout(updateCanvasSize, 150);
    window.addEventListener('resize', () => setTimeout(updateCanvasSize, 100));
    window.addEventListener('orientationchange', () => {
      setTimeout(updateCanvasSize, 300);
    });
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
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
  
  // 이메일 형식 검증 (주석 처리)
  // const validateEmail = (email) => {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   return emailRegex.test(email);
  // };

  // 갤럭시워치 배송 주소 변경 시 주소 연동 업데이트
  useEffect(() => {
    if (useWatchAddressForResidence && userData.watchDeliveryAddress) {
      updateUserData({ address: userData.watchDeliveryAddress });
    }
  }, [userData.watchDeliveryAddress, useWatchAddressForResidence]);
  
  // 사용자 데이터 업데이트 함수
  const updateUserData = (newData) => {
    setUserData(prevData => ({
      ...prevData,
      ...newData
    }));
  };
  
  // 이메일 입력 처리 (주석 처리)
  // const handleEmailChange = (e) => {
  //   const { value } = e.target;
  //   updateUserData({ email: value });
  //   
  //   if (value && !validateEmail(value)) {
  //     setEmailError('유효한 이메일 주소를 입력해주세요.');
  //   } else {
  //     setEmailError('');
  //   }
  // };
  

  
  // 날짜 유효성 검사 함수
  const isValidDate = (year, month, day) => {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === parseInt(year) && 
           date.getMonth() === month - 1 && 
           date.getDate() === parseInt(day);
  };

  // 생년월일 자동 포맷팅 함수
  const formatBirthDate = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');
    
    // 최대 8자리까지만 허용
    const truncated = numbers.slice(0, 8);
    
    // 현재 연도 가져오기
    const currentYear = new Date().getFullYear();
    
    // 자동으로 하이픈 추가
    if (truncated.length <= 4) {
      // 연도 입력 중 - 현재 연도보다 큰 연도 차단
      if (truncated.length === 4 && parseInt(truncated) > currentYear) {
        return truncated.slice(0, 3); // 미래 연도면 3자리까지만
      }
      return truncated;
    } else if (truncated.length <= 6) {
      const year = truncated.slice(0, 4);
      const month = truncated.slice(4, 6);
      
      // 연도 검증 - 현재 연도보다 큰 경우 차단
      if (parseInt(year) > currentYear) {
        return truncated.slice(0, 3);
      }
      
      // 월 검증 (01-12) - 0으로 시작하는 경우 허용
      if (month.length === 2 && (parseInt(month) < 1 || parseInt(month) > 12)) {
        return `${year}-${truncated.slice(4, 5)}`; // 잘못된 월이면 첫째 자리까지만
      }
      
      return `${year}-${month}`;
    } else {
      const year = truncated.slice(0, 4);
      const month = truncated.slice(4, 6);
      const day = truncated.slice(6, 8);
      
      // 연도 검증 - 현재 연도보다 큰 경우 차단
      if (parseInt(year) > currentYear) {
        return truncated.slice(0, 3);
      }
      
      // 월 검증 (01-12)
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        return `${year}-${truncated.slice(4, 5)}`; // 월이 잘못되면 첫째 자리까지만
      }
      
      // 일 검증 (01-31 및 해당 월의 유효한 일자)
      if (parseInt(day) < 1 || parseInt(day) > 31) {
        return `${year}-${month}-${truncated.slice(6, 7)}`; // 일이 잘못되면 첫째 자리까지만
      }
      
      // 실제 날짜 유효성 검사 (예: 2월 30일 방지)
      if (!isValidDate(year, month, day)) {
        return `${year}-${month}-${truncated.slice(6, 7)}`; // 유효하지 않은 날짜면 일의 첫째 자리까지만
      }
      
      // 미래 날짜 체크 (완전한 날짜일 때)
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // 오늘 끝까지 허용
      
      if (inputDate > today) {
        return `${year}-${month}-${truncated.slice(6, 7)}`; // 미래 날짜면 일의 첫째 자리까지만
      }
      
      return `${year}-${month}-${day}`;
    }
  };

  // 생년월일 입력 처리
  const handleBirthDateChange = (e) => {
    const { value } = e.target;
    const formattedValue = formatBirthDate(value);
    
    // 에러 메시지 초기화
    setRegistrationError('');
    
    updateUserData({ birthDate: formattedValue });
  };

  // 일반 입력 처리
  const handleChange = (e) => {
    const { id, value } = e.target;
    updateUserData({ [id]: value });
  };

  // 주소 연동 체크박스 처리
  const handleAddressSyncChange = (e) => {
    const isChecked = e.target.checked;
    setUseWatchAddressForResidence(isChecked);
    
    if (isChecked && userData.watchDeliveryAddress) {
      // 갤럭시워치 배송 주소를 주소 필드에 복사
      updateUserData({ address: userData.watchDeliveryAddress });
    } else if (!isChecked) {
      // 체크 해제 시 주소 필드 비우기
      updateUserData({ address: '' });
    }
  };

  // 서명 패드 관련 함수
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData(null);
      // 파일 상태도 초기화
      setFiles(prev => ({
        ...prev,
        signatureImage: null
      }));
    }
  };

  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const canvas = signatureRef.current.getCanvas();
      const dataURL = canvas.toDataURL('image/png');
      
      // dataURL을 File 객체로 변환
      fetch(dataURL)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'signature.png', { type: 'image/png' });
          setFiles(prev => ({
            ...prev,
            signatureImage: file
          }));
          setSignatureData(dataURL);
        });
    }
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
      }

      setFiles(prev => ({
        ...prev,
        [fileType]: processedFile
      }));
      
      setRegistrationError('');
    } catch (error) {
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

  // 1단계: 기본 정보 입력 (단계별 처리)
  const handleStep1Submit = async () => {
    if (step1State === 'namePhone') {
      // 이름 + 전화번호 확인
      if (!userData.name || !userData.phone) {
        setRegistrationError('이름과 전화번호를 입력해주세요.');
        return;
      }
      
      if (!validatePhoneNumber(userData.phone)) {
        setRegistrationError('전화번호는 010으로 시작하는 11자리 번호여야 합니다.');
        return;
      }

      // DB에서 이름+전화번호로 사용자 확인
      try {
        setRegistrationError('사용자 정보를 확인하는 중...');
        
        const normalizedPhone = userData.phone.replace(/\D/g, '');
        
        const { data: existingUsers, error: searchError } = await supabase
          .from('survey-person')
          .select('id, name, email, phone, registration_step, confirmation_status')
          .eq('name', userData.name.trim())
          .eq('phone', normalizedPhone);

        if (searchError) {
          setRegistrationError('사용자 정보 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
          return;
        }

        if (existingUsers && existingUsers.length > 0) {
          const existingUser = existingUsers[0];
          setFoundUser(existingUser);
          
          // 등록 단계별 처리
          const { confirmation_status, registration_step } = existingUser;

          // 1. 거부된 사용자인지 확인
          if (confirmation_status === 'rejected') {
            setRegistrationError('죄송합니다. 참여가 거부된 사용자입니다. 자세한 사항은 관리자에게 문의해주세요.');
            return;
          }

          // 2. 이미 등록을 완료했는지 확인 - 수정 가능하도록 변경
          if (registration_step >= REGISTRATION_STEPS.CONSENT_SUBMITTED) { // 3단계 이상
            // 수정 확인 대화박스
            const confirmEdit = window.confirm(
              '이미 제출한 참가자입니다. 수정을 진행하시겠습니까?\n\n수정하시려면 "확인"을 클릭해주세요.'
            );
            
            if (!confirmEdit) {
              setRegistrationError('수정을 취소했습니다.');
              return;
            }

            // 기존 데이터를 불러와서 수정 모드로 진입
            try {
              const { data: existingData, error: fetchError } = await supabase
                .from('survey-person')
                .select('*')
                .eq('id', existingUser.id)
                .single();

              if (!fetchError && existingData) {
                // 기존 데이터로 상태 업데이트
                setUserData(prevData => ({
                  ...prevData,
                  address: existingData.address || '',
                  gender: existingData.gender || '',
                  birthDate: existingData.birth_date || '',
                  department: existingData.department || '',
                  idCardUploadMethod: existingData.id_card_upload_method || '',
                  bankAccountUploadMethod: existingData.bank_account_upload_method || '',
                  watchDeliveryAddress: existingData.watch_delivery_address || ''
                }));

                // 동의 상태도 복원
                setConsentChecked({
                  personalInfo: true, // 이미 제출했으므로 true
                  experimentParticipation: existingData.experiment_consent,
                  dataUsage: existingData.data_usage_consent,
                  thirdParty: existingData.third_party_consent || false
                });

                // 갤럭시워치 배송 주소 입력부터 수정 모드로 시작
                setExistingUserId(existingUser.id);
                setIsEditMode(true); // 수정 모드 활성화
                setRegistrationError('');
                setStep1State('address'); // 갤럭시워치 주소 입력 단계로 설정
                setCurrentStep(1); // 1단계의 주소 입력부터 시작
                return;
              }
            } catch (error) {
              console.warn('기존 데이터 로드 실패:', error);
            }
            
            // 데이터 로드 실패 시 기본 진행
            setRegistrationError('서류가 이미 제출되었습니다. 수정이 필요한 경우 다시 시도해주세요.');
            setStep1State('address');
            return;
          }

          // 3. 관리자 승인 여부 확인
          if (confirmation_status === 'approved') {
            // 승인된 사용자 (정상 상태: registration_step === 2)
            // 다음 단계(주소 입력)로 진행
            setRegistrationError('');
            setStep1State('address');
          } else {
            // 미승인 사용자 (승인 대기 중, 정상 상태: registration_step === 1)
            setRegistrationError('현재 관리자 승인 대기 중입니다. 승인 완료 후 다시 시도해주세요.');
            return;
          }
        } else {
          setRegistrationError('등록되지 않은 사용자입니다. 먼저 대기자 등록을 완료해주세요.');
          return;
        }
        
      } catch (error) {
        setRegistrationError('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    // } else if (step1State === 'email') {
    //   // 이메일 확인 (주석 처리)
    //   if (!userData.email) {
    //     setRegistrationError('이메일을 입력해주세요.');
    //     return;
    //   }
    //   
    //   if (!validateEmail(userData.email)) {
    //     setRegistrationError('유효한 이메일 주소를 입력해주세요.');
    //     return;
    //   }

    //   // 이름 + 전화번호 + 이메일로 정확한 매치 확인
    //   try {
    //     setRegistrationError('사용자 정보를 확인하는 중...');
    //     
    //     const normalizedPhone = userData.phone.replace(/\D/g, '');
    //     
    //     const { data: existingUsers, error: searchError } = await supabase
    //       .from('survey-person')
    //       .select('id, name, email, phone, registration_step, confirmation_status')
    //       .eq('name', userData.name.trim())
    //       .eq('email', userData.email.trim())
    //       .eq('phone', normalizedPhone);

    //     if (searchError) {
    //       setRegistrationError('사용자 정보 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    //       return;
    //     }

    //     if (existingUsers && existingUsers.length > 0) {
    //       const existingUser = existingUsers[0];
    //       setFoundUser(existingUser);
    //       
    //       // 등록 단계 확인
    //       if (!canRegister(existingUser.registration_step)) {
    //         setRegistrationError('이미 등록이 완료된 사용자입니다. 등록을 다시 진행할 수 없습니다.');
    //         return;
    //       }
    //       
    //       // 확정여부 확인
    //       if (existingUser.confirmation_status === 'approved') {
    //         // 승인된 사용자 - 갤럭시워치 배송 주소 입력 단계로 이동
    //         setRegistrationError('');
    //         setStep1State('address');
    //       } else {
    //         // 승인되지 않은 사용자 - 바로 다음 단계로
    //         setExistingUserId(existingUser.id);
    //         setRegistrationError('');
    //         nextStep();
    //       }
    //     } else {
    //       setRegistrationError('입력하신 정보와 일치하는 사용자를 찾을 수 없습니다. 정보를 다시 확인해주세요.');
    //       return;
    //     }
    //     
    //   } catch (error) {
    //     setRegistrationError('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    //   }
    } else if (step1State === 'address') {
      // 갤럭시워치 배송 주소 및 근무 소속부서 확인
      if (!userData.watchDeliveryAddress) {
        setRegistrationError('갤럭시워치 배송 주소를 입력해주세요.');
        return;
      }
      
      if (!userData.department) {
        setRegistrationError('근무 소속부서를 입력해주세요.');
        return;
      }
      
      // 다음 단계로 이동
      if (foundUser) {
        setExistingUserId(foundUser.id);
      }
      setRegistrationError('');
      nextStep();
    }
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

    // 생년월일 형식 및 유효성 검사
    if (userData.birthDate) {
      const birthDatePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!birthDatePattern.test(userData.birthDate)) {
        setRegistrationError('생년월일을 올바른 형식으로 입력해주세요. (예: 1990-01-15)');
        return;
      }

      // 날짜 유효성 검사
      const [year, month, day] = userData.birthDate.split('-').map(Number);
      if (!isValidDate(year, month, day)) {
        setRegistrationError('존재하지 않는 날짜입니다. 올바른 생년월일을 입력해주세요.');
        return;
      }

      // 미래 날짜 체크
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (inputDate > today) {
        setRegistrationError('미래 날짜는 입력할 수 없습니다. 올바른 생년월일을 입력해주세요.');
        return;
      }

      // 너무 과거 날짜 체크 (100년 전)
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
      
      if (inputDate < hundredYearsAgo) {
        setRegistrationError('생년월일이 너무 과거입니다. 올바른 생년월일을 입력해주세요.');
        return;
      }

      // 완전한 8자리 날짜인지 확인 (YYYY-MM-DD 형태)
      if (userData.birthDate.length !== 10) {
        setRegistrationError('생년월일을 완전히 입력해주세요. (예: 1990-01-15)');
        return;
      }
    }

    if (!files.signatureImage) {
      setRegistrationError('서명을 그리고 저장 버튼을 눌러주세요.');
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
          const filePath = await uploadFileToStorage(file, fileName, fileType);
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
          uploadErrors.push(`${fileType} 파일 업로드 실패: ${error.message}`);
          return null;
        }
      }
      return null;
    };

    // 직접 전송 추적 헬퍼 함수
    const trackDirectSubmission = (fileType, typeName) => {
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

    // 서명 이미지 처리 (항상 업로드 방식)
    if (files.signatureImage) {
      const uploadResult = await uploadFile(files.signatureImage, `signature_image_${participantId}`, 'signatureImage');
      if (uploadResult) fileUploads.push(uploadResult);
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

      // RLS를 위한 사용자 세션 확보 (실패해도 계속 진행)
      // eslint-disable-next-line no-unused-vars
      const user = await ensureUserSession();

      // 기존 사용자 레코드 업데이트 방식 (단순화)
      
      if (!existingUserId) {
        throw new Error('사용자 ID가 없습니다. 1단계부터 다시 진행해주세요.');
      }
      
      // 기존 레코드 업데이트 데이터 준비
      const finalAddress = useWatchAddressForResidence ? userData.watchDeliveryAddress : userData.address;
      
      const updateData = {
        address: finalAddress,
        gender: userData.gender,
        birth_date: userData.birthDate,
        department: userData.department, // 근무 소속부서 추가
        signature_upload_method: 'draw', // 항상 직접 서명
        id_card_upload_method: userData.idCardUploadMethod,
        bank_account_upload_method: userData.bankAccountUploadMethod,
        consent_date: new Date().toISOString().split('T')[0],
        registration_step: REGISTRATION_STEPS.CONSENT_SUBMITTED,
        experiment_consent: consentChecked.experimentParticipation === true,
        data_usage_consent: consentChecked.dataUsage === true,
        third_party_consent: consentChecked.thirdParty,
        watch_delivery_address: userData.watchDeliveryAddress || '' // 갤럭시워치 배송 주소 추가
      };
      
      // RPC 함수를 통한 업데이트 시도 (CORS 우회)
      let updateSuccess = false;
      let participantId = existingUserId;
      
      try {
        const { error: rpcError } = await supabase.rpc('update_person_registration', {
          person_id: existingUserId,
          update_data: updateData
        });
        
        if (!rpcError) {
          updateSuccess = true;
        }
      } catch (error) {
        // RPC 실패 시 기존 방식으로 시도
      }

      // RPC 실패 시 기존 방식으로 시도
      if (!updateSuccess) {
        try {
          const { error: updateError } = await supabase
            .from('survey-person')
            .update(updateData)
            .eq('id', existingUserId);
          
          if (updateError) {
            throw new Error(`데이터 업데이트에 실패했습니다: ${updateError.message}`);
          } else {
            updateSuccess = true;
          }
        } catch (error) {
          throw new Error(`등록 처리에 실패했습니다: ${error.message}`);
        }
      }

      if (!updateSuccess) {
        throw new Error('데이터 업데이트에 실패했습니다. 관리자에게 문의해주세요.');
      }

      // 파일 업로드 처리 (스토리지 업로드 + DB 저장)
      const { fileUploads } = await processFileUploads(participantId);
      
      // 파일 정보 데이터베이스에 저장 (실제 업로드된 파일이 있는 경우만)
      if (fileUploads.length > 0) {
        try {
          const { error: fileError } = await supabase
            .from('uploaded_files')
            .insert(fileUploads);
          
          if (fileError) {
            console.warn('파일 정보 저장 실패:', fileError);
          }
        } catch (error) {
          console.warn('파일 정보 저장 중 오류:', error);
        }
      }

      // 등록 성공 처리
      setRegistrationSuccess(true);
      
    } catch (error) {
      setRegistrationError(`등록 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsRegistering(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="data-collection-guide">
      <div className="guide-header">
        <h1>실증 실험 참여자 서류 제출</h1>
      </div>
      
      <div className="guide-content">
        {registrationSuccess ? (
          <div className="registration-success-box">
            <h3>서류 제출이 완료되었습니다!</h3>
            <p>실험 참여가 확정되었습니다.</p>
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
            {/* 수정 모드 알림 - 상단에 표시 */}
            {isEditMode && (
              <div style={{ 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '8px', 
                padding: '15px', 
                marginBottom: '20px',
                color: '#856404'
              }}>
                <h6 style={{ margin: '0 0 10px 0', color: '#856404' }}>📝 서류 수정 모드</h6>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  이미 제출된 서류를 수정하고 있습니다. 필요한 항목을 변경한 후 다시 제출해주세요.
                </p>
              </div>
            )}

            {/* 진행 상태 표시 */}
            <div className="step-indicator">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. 기본정보</div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. 동의서</div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. 서류제출</div>
            </div>

            {/* 1단계: 기본 정보 입력 (단계별 표시) */}
            {currentStep === 1 && (
              <div className="registration-step">
                <h5>1단계: 기본 정보 입력</h5>
                <div className="form-section">
                  {/* 이름 + 전화번호 입력 */}
                  <div className="form-group">
                    <label htmlFor="name"><strong>이름</strong></label>
                    <input 
                      type="text" 
                      id="name" 
                      value={userData.name || ''}
                      onChange={handleChange}
                      disabled={step1State !== 'namePhone'}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone"><strong>전화번호</strong></label>
                    <input 
                      type="tel" 
                      id="phone" 
                      value={phoneFormatted}
                      onChange={handlePhoneInputChange}
                      placeholder="010-0000-0000"
                      disabled={step1State !== 'namePhone'}
                      required
                      className={phoneError ? 'input-error' : ''}
                    />
                    {phoneError ? (
                      <p className="error-message">{phoneError}</p>
                    ) : (
                      <p className="helper-text">형식: 010-0000-0000</p>
                    )}
                  </div>


                  {/* 이메일 입력 (주석 처리) */}
                  {/* {step1State !== 'namePhone' && (
                    <div className="form-group">
                      <label htmlFor="email"><strong>이메일</strong></label>
                      <input 
                        type="email" 
                        id="email" 
                        value={userData.email || ''}
                        onChange={handleEmailChange}
                        disabled={step1State === 'address'}
                        required
                        className={emailError ? 'input-error' : ''}
                      />
                      {emailError && <p className="error-message">{emailError}</p>}
                      {step1State === 'email' && foundUser && foundUser.confirmation_status === 'approved' && (
                        <p className="success-message" style={{color: 'green'}}>
                          확정된 참여자입니다! 갤럭시워치 배송 주소를 입력해주세요.
                        </p>
                      )}
                      {step1State === 'email' && foundUser && foundUser.confirmation_status !== 'approved' && (
                        <p className="info-message" style={{color: 'blue'}}>
                          연구진 확인 중인 참여자입니다.
                        </p>
                      )}
                    </div>
                  )} */}

                  {/* 갤럭시워치 배송 주소 입력 (조건부 표시) */}
                  {step1State === 'address' && (
                    <>
                      <div className="form-group" style={{backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '2px solid #28a745'}}>
                        <label htmlFor="watchDeliveryAddress"><strong>갤럭시워치 배송 주소</strong></label>
                        <input 
                          type="text" 
                          id="watchDeliveryAddress" 
                          value={userData.watchDeliveryAddress || ''}
                          onChange={handleChange}
                          placeholder="갤럭시워치를 받으실 주소를 입력해주세요"
                          required
                        />
                        <p className="helper-text" style={{color: '#28a745'}}>
                          갤럭시워치가 이 주소로 배송됩니다. 정확한 주소를 입력해주세요.
                        </p>
                      </div>

                      <div className="form-group">
                        <label htmlFor="department"><strong>근무 소속부서</strong></label>
                        <input 
                          type="text" 
                          id="department" 
                          value={userData.department || ''}
                          onChange={handleChange}
                          placeholder="예: 지구대, 기동대, 광역수사대 등"
                          required
                        />
                        <p className="helper-text">소속 부서명을 입력해주세요</p>
                      </div>
                    </>
                  )}
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
                    {step1State === 'namePhone' ? '다음' : 
                     '다음 단계'}
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
                              const baseUrl = process.env.PUBLIC_URL || window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
                              
                              // 여러 경로를 시도
                              const possiblePaths = [
                                `${baseUrl}/${encodeURIComponent(fileName)}`,
                                `${window.location.origin}${process.env.PUBLIC_URL || ''}/${encodeURIComponent(fileName)}`,
                                `./${encodeURIComponent(fileName)}`,
                                `/${encodeURIComponent(fileName)}`
                              ];
                              
                              let response = null;
                              
                              for (const path of possiblePaths) {
                                try {
                                  response = await fetch(path);
                                  if (response.ok) {
                                    break;
                                  }
                                } catch (error) {
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                      <label htmlFor="address"><strong>주소 (동까지만)</strong></label>
                      {userData.watchDeliveryAddress && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'normal', color: '#6c757d' }}>
                          <input 
                            type="checkbox" 
                            checked={useWatchAddressForResidence}
                            onChange={handleAddressSyncChange}
                            style={{ transform: 'scale(1.1)' }}
                          />
                          갤럭시워치 배송 주소와 동일
                        </label>
                      )}
                    </div>
                    <input 
                      type="text" 
                      id="address" 
                      value={userData.address || ''}
                      onChange={handleChange}
                      placeholder="예: 서울시 강남구 역삼동"
                      disabled={useWatchAddressForResidence}
                      required
                      style={{
                        backgroundColor: useWatchAddressForResidence ? '#f8f9fa' : '#ffffff',
                        color: useWatchAddressForResidence ? '#6c757d' : '#495057'
                      }}
                    />
                    {useWatchAddressForResidence && userData.watchDeliveryAddress && (
                      <p className="helper-text" style={{ color: '#28a745', fontSize: '13px', marginTop: '5px' }}>
                        갤럭시워치 배송 주소와 동일하게 설정되었습니다.
                      </p>
                    )}
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
                      type="text" 
                      id="birthDate" 
                      value={userData.birthDate || ''}
                      onChange={handleBirthDateChange}
                      className="date-input"
                      placeholder="YYYYMMDD (숫자만 입력하세요)"
                      maxLength="10"
                      required
                    />
                    <p className="helper-text" style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>
                      숫자만 입력하면 자동으로 형식이 맞춰집니다 (예: 19900115 → 1990-01-15)
                    </p>
                  </div>

                  <div className="form-group">
                    <label><strong>서명 *</strong></label>
                    
                    {/* 직접 서명만 남기고 다른 옵션 제거 */}
                      <div className="signature-pad-container" style={{ marginTop: '15px' }}>
                        <style>
                          {`
                            .signature-pad-container {
                              width: 100%;
                              display: flex;
                              flex-direction: column;
                              align-items: center;
                              padding: 0 30px;
                            }
                            .signature-canvas-wrapper {
                              border: 2px solid #000;
                              border-radius: 8px;
                              background-color: #fff;
                              margin-top: 10px;
                              position: relative;
                              overflow: hidden;
                              max-width: 100%;
                              box-sizing: border-box;
                            }
                            .signature-canvas {
                              display: block !important;
                              touch-action: none !important;
                              cursor: crosshair;
                              border: none !important;
                              border-radius: 0 !important;
                              margin: 0 !important;
                              padding: 0 !important;
                            }
                            .signature-buttons {
                              margin-top: 15px;
                              display: flex;
                              gap: 15px;
                              justify-content: center;
                              flex-wrap: wrap;
                            }
                            .signature-btn {
                              padding: 10px 20px;
                              border: none;
                              border-radius: 6px;
                              cursor: pointer;
                              font-size: 14px;
                              font-weight: 600;
                              min-width: 100px;
                              transition: all 0.2s ease;
                            }
                            .signature-btn.clear {
                              background-color: #6c757d;
                              color: white;
                            }
                            .signature-btn.save {
                              background-color: #007bff;
                              color: white;
                            }
                            .signature-btn:hover {
                              transform: translateY(-1px);
                              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            }
                            .signature-btn:active {
                              transform: translateY(0);
                            }
                            .signature-preview {
                              margin-top: 20px;
                              text-align: center;
                              padding: 20px;
                              background-color: #f8f9fa;
                              border-radius: 8px;
                              border: 1px solid #e9ecef;
                              width: 100%;
                              max-width: 500px;
                            }
                            .signature-preview img {
                              border: 1px solid #ddd;
                              border-radius: 4px;
                              max-width: 100%;
                              height: auto;
                              background-color: white;
                            }
                            @media (max-width: 768px) {
                              .signature-pad-container {
                                padding: 0 20px;
                              }
                              .signature-canvas-wrapper {
                                border: 2px solid #000 !important;
                                margin: 10px auto !important;
                                width: 100% !important;
                                max-width: calc(100vw - 80px) !important;
                              }
                              .signature-canvas {
                                border: none !important;
                                border-radius: 0 !important;
                                width: 100% !important;
                                height: auto !important;
                              }
                              .signature-buttons {
                                flex-direction: row;
                                gap: 12px;
                                margin-top: 20px;
                              }
                              .signature-btn {
                                flex: 1;
                                max-width: 140px;
                                padding: 14px 20px;
                                font-size: 16px;
                                touch-action: manipulation;
                              }
                            }
                            @media (max-width: 480px) {
                              .signature-pad-container {
                                padding: 0 15px;
                              }
                              .signature-canvas-wrapper {
                                max-width: calc(100vw - 50px) !important;
                              }
                              .signature-btn {
                                padding: 16px 20px;
                                font-size: 16px;
                                min-height: 50px;
                              }
                            }
                            
                            /* 모바일에서 페이지 스크롤 방지 */
                            @media (max-width: 768px) {
                              .signature-pad-container.active {
                                position: relative;
                                z-index: 10;
                              }
                              .signature-canvas-wrapper.active {
                                overflow: hidden;
                              }
                            }
                          `}
                        </style>
                        <label><strong>아래에 서명해주세요</strong></label>
                        <div 
                          className="signature-canvas-wrapper" 
                          style={{ 
                            width: `${canvasSize.width}px`, 
                            height: `${canvasSize.height}px`,
                            margin: '0 auto',
                            display: 'block',
                            position: 'relative'
                          }}
                        >
                          <SignatureCanvas 
                            ref={signatureRef}
                            penColor='black'
                            minWidth={2}
                            maxWidth={2}
                            throttle={0}
                            velocityFilterWeight={0.7}
                            canvasProps={{
                              width: canvasSize.width,
                              height: canvasSize.height,
                              className: 'signature-canvas',
                              style: {
                                width: `${canvasSize.width}px`,
                                height: `${canvasSize.height}px`,
                                display: 'block',
                                touchAction: 'none',
                                position: 'absolute',
                                top: '0',
                                left: '0'
                              }
                            }}
                            backgroundColor='rgba(255,255,255,1)'
                          />
                        </div>
                        <div className="signature-buttons">
                          <button 
                            type="button" 
                            onClick={clearSignature}
                            className="signature-btn clear"
                          >
                            지우기
                          </button>
                          <button 
                            type="button" 
                            onClick={saveSignature}
                            className="signature-btn save"
                          >
                            저장
                          </button>
                        </div>
                        {signatureData && (
                          <div className="signature-preview">
                            <p style={{ color: '#28a745', fontWeight: 'bold', margin: '0 0 15px 0' }}>✓ 서명이 저장되었습니다</p>
                            <img 
                              src={signatureData} 
                              alt="저장된 서명"
                            />
                          </div>
                        )}
                        <p className="helper-text">마우스나 터치로 서명한 후 '저장' 버튼을 눌러주세요.</p>
                      </div>

                    {/* 서명 예시 */}
                    <div className="signature-example" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                      <h6 style={{ marginBottom: '15px', color: '#495057', fontSize: '14px', fontWeight: '600' }}>서명 예시</h6>
                      <div className="signature-example-image" style={{ textAlign: 'center' }}>
                        <img 
                          src={`${process.env.PUBLIC_URL || ''}/sign_reference.png`}
                          alt="서명 예시"
                          className="signature-example-img"
                          style={{
                            width: '100%',
                            height: 'auto',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: '#fff'
                          }}
                        />
                      </div>
                    </div>
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
                    <style>
                      {`
                        .consent-item {
                          margin: 20px 0;
                          padding: 15px;
                          background-color: #f8f9fa;
                          border: 1px solid #e9ecef;
                          border-radius: 8px;
                        }
                        .consent-item input[type="checkbox"] {
                          margin-right: 10px;
                          transform: scale(1.2);
                        }
                        .consent-item label {
                          display: flex;
                          align-items: flex-start;
                          gap: 10px;
                          cursor: pointer;
                          line-height: 1.5;
                          word-break: keep-all;
                          font-size: 14px;
                        }
                        .consent-details {
                          margin-top: 15px;
                          padding-left: 30px;
                        }
                        .consent-details ul {
                          margin: 0;
                          padding-left: 20px;
                        }
                        .consent-details li {
                          margin-bottom: 8px;
                          line-height: 1.4;
                          word-break: keep-all;
                          font-size: 13px;
                          color: #6c757d;
                        }
                        @media (max-width: 768px) {
                          .consent-item {
                            margin: 15px 0;
                            padding: 12px;
                          }
                          .consent-item label {
                            font-size: 13px;
                            line-height: 1.4;
                          }
                          .consent-details {
                            padding-left: 20px;
                            margin-top: 12px;
                          }
                          .consent-details li {
                            font-size: 12px;
                            margin-bottom: 6px;
                          }
                        }
                      `}
                    </style>
                    <label>
                      <input 
                        type="checkbox" 
                        id="personalInfo" 
                        name="personalInfo" 
                        checked={consentChecked.personalInfo}
                        onChange={(e) => setConsentChecked(prev => ({...prev, personalInfo: e.target.checked}))}
                      />
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
                  <style>
                    {`
                      .step-actions {
                        display: flex;
                        gap: 15px;
                        justify-content: space-between;
                        align-items: center;
                      }
                      .step-actions .btn {
                        flex: 1;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        min-width: 0;
                        padding: 12px 20px;
                        font-size: 14px;
                        font-weight: 600;
                      }
                      @media (max-width: 768px) {
                        .step-actions {
                          flex-direction: column;
                          gap: 12px;
                        }
                        .step-actions .btn {
                          width: 100%;
                          white-space: normal;
                          word-break: keep-all;
                          line-height: 1.4;
                          padding: 16px 20px;
                          text-align: center;
                          flex: none;
                        }
                      }
                      @media (max-width: 480px) {
                        .step-actions .btn {
                          padding: 18px 15px;
                          font-size: 14px;
                          min-height: 52px;
                        }
                      }
                    `}
                  </style>
                  <button 
                    type="button" 
                    className="btn prev-btn"
                    onClick={prevStep}
                  >
                    이전 단계
                  </button>
                  <button 
                    type="button" 
                    className={`btn next-btn ${isFinalSubmitValid() ? 'active' : 'disabled'}`}
                    onClick={handleFinalSubmit}
                    disabled={isRegistering || isUploading || !isFinalSubmitValid()}
                  >
                    {isRegistering ? (isUploading ? '파일 업로드 중...' : '등록 중...') : 
                     (isEditMode ? '서류 수정 제출' : '참여자 서류 제출')}
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