// 등록 단계 상수 정의
export const REGISTRATION_STEPS = {
  WAITLIST: 0,              // 대기자 상태 - 설문 완료, 연구진 연락 대기
  INITIAL: 1,               // 초기 등록 상태 - 기본 사용자 생성
  IN_PROGRESS: 2,           // 등록 진행 중 - 서류 작성/제출 과정
  COMPLETED: 3,             // 등록 완료 - 모든 서류 제출 완료, 실험 대기
  EXPERIMENT_COMPLETED: 4   // 실험 완료 - 3주 실증 실험 완료
};

// 단계별 설명
export const STEP_DESCRIPTIONS = {
  [REGISTRATION_STEPS.WAITLIST]: '대기자 상태',
  [REGISTRATION_STEPS.INITIAL]: '초기 등록',
  [REGISTRATION_STEPS.IN_PROGRESS]: '등록 진행 중',
  [REGISTRATION_STEPS.COMPLETED]: '등록 완료',
  [REGISTRATION_STEPS.EXPERIMENT_COMPLETED]: '실험 완료'
};

// 단계별 상세 설명
export const STEP_DETAILS = {
  [REGISTRATION_STEPS.WAITLIST]: {
    description: '설문조사 완료 후 실증 실험 대기자 등록 상태',
    nextActions: ['연구진 개별 연락', '갤럭시 워치 배송 안내'],
    allowedTransitions: [REGISTRATION_STEPS.INITIAL, REGISTRATION_STEPS.IN_PROGRESS]
  },
  [REGISTRATION_STEPS.INITIAL]: {
    description: '사용자 계정 생성 후 초기 상태',
    nextActions: ['실증 실험 참여자 등록 시작'],
    allowedTransitions: [REGISTRATION_STEPS.IN_PROGRESS]
  },
  [REGISTRATION_STEPS.IN_PROGRESS]: {
    description: '실증 실험 참여를 위한 서류 작성 및 제출 과정',
    nextActions: ['동의서 작성', '개인정보 입력', '신분증/통장 사본 제출'],
    allowedTransitions: [REGISTRATION_STEPS.COMPLETED]
  },
  [REGISTRATION_STEPS.COMPLETED]: {
    description: '모든 등록 절차 완료, 실험 시작 대기',
    nextActions: ['갤럭시 워치 수령', '실증 실험 시작'],
    allowedTransitions: [REGISTRATION_STEPS.EXPERIMENT_COMPLETED]
  },
  [REGISTRATION_STEPS.EXPERIMENT_COMPLETED]: {
    description: '3주간 실증 실험 완료',
    nextActions: ['사례비 지급 절차', '워치 반납'],
    allowedTransitions: []
  }
};

// 등록 가능 여부 확인 함수
export const canRegister = (currentStep) => {
  return currentStep < REGISTRATION_STEPS.COMPLETED;
};

// 실험 완료 여부 확인 함수
export const isExperimentCompleted = (currentStep) => {
  return currentStep === REGISTRATION_STEPS.EXPERIMENT_COMPLETED;
};

// 단계 전환 가능 여부 확인 함수
export const canTransitionTo = (currentStep, targetStep) => {
  const allowedTransitions = STEP_DETAILS[currentStep]?.allowedTransitions || [];
  return allowedTransitions.includes(targetStep);
}; 