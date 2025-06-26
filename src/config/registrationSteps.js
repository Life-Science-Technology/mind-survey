// 등록 단계 상수 정의
export const REGISTRATION_STEPS = {
  SURVEY_COMPLETED: 1,      // 설문조사 완료
  PARTICIPANT_CONFIRMED: 2, // 참여자 확정 (관리자 승인)
  CONSENT_SUBMITTED: 3,     // 동의서 제출 (동의서 및 사본 제출)
  CLINICAL_WAITING: 4       // 임상실험 대기 (임상실험 진행)
};

// 단계별 설명
export const STEP_DESCRIPTIONS = {
  [REGISTRATION_STEPS.SURVEY_COMPLETED]: '설문조사 완료',
  [REGISTRATION_STEPS.PARTICIPANT_CONFIRMED]: '참여자 확정',
  [REGISTRATION_STEPS.CONSENT_SUBMITTED]: '동의서 제출',
  [REGISTRATION_STEPS.CLINICAL_WAITING]: '임상실험 대기'
};

// 단계별 상세 설명
export const STEP_DETAILS = {
  [REGISTRATION_STEPS.SURVEY_COMPLETED]: {
    description: '정신 건강 설문조사 완료 상태',
    nextActions: ['관리자 검토 대기', '참여자 확정 여부 결정'],
    allowedTransitions: [REGISTRATION_STEPS.PARTICIPANT_CONFIRMED]
  },
  [REGISTRATION_STEPS.PARTICIPANT_CONFIRMED]: {
    description: '관리자가 참여자로 확정한 상태 (확정여부 "가" 선택)',
    nextActions: ['동의서 작성 안내', '서류 제출 요청'],
    allowedTransitions: [REGISTRATION_STEPS.CONSENT_SUBMITTED]
  },
  [REGISTRATION_STEPS.CONSENT_SUBMITTED]: {
    description: '동의서 및 필요 서류 제출 완료',
    nextActions: ['서류 검토', '임상실험 준비'],
    allowedTransitions: [REGISTRATION_STEPS.CLINICAL_WAITING]
  },
  [REGISTRATION_STEPS.CLINICAL_WAITING]: {
    description: '임상실험 진행 중 또는 대기 상태',
    nextActions: ['갤럭시 워치 배송', '실증 실험 진행'],
    allowedTransitions: []
  }
};

// 등록 가능 여부 확인 함수
export const canRegister = (currentStep) => {
  return currentStep < REGISTRATION_STEPS.CLINICAL_WAITING;
};

// 임상실험 진행 여부 확인 함수
export const isClinicalWaiting = (currentStep) => {
  return currentStep === REGISTRATION_STEPS.CLINICAL_WAITING;
};

// 단계 전환 가능 여부 확인 함수
export const canTransitionTo = (currentStep, targetStep) => {
  const allowedTransitions = STEP_DETAILS[currentStep]?.allowedTransitions || [];
  return allowedTransitions.includes(targetStep);
}; 