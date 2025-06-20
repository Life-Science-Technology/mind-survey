import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키를 가져옵니다
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// Supabase 클라이언트 생성
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL과 API Key가 설정되지 않았습니다. 환경변수를 확인해주세요.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  // RLS 정책이 적용되도록 설정
  db: {
    schema: 'public'
  },
  // CORS 관련 설정 추가
  headers: {
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  // 전역 헤더 설정
  global: {
    headers: {
      'X-Client-Info': 'survey-app@1.0.0',
      'X-Requested-With': 'XMLHttpRequest'
    },
  },
});

// RLS를 위한 헬퍼 함수들
export const ensureUserSession = async () => {
  try {
    // 실제 Supabase 사용 시에는 세션 체크 없이 진행 
    // (RLS 정책이 데이터베이스 레벨에서 보안을 처리)
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return data.user || { id: 'anonymous-user' };
  } catch (error) {
    // 오류가 발생해도 계속 진행할 수 있도록 기본 사용자 반환
    console.warn('User session error:', error.message);
    return { id: 'fallback-user' };
  }
};

export const getCurrentUserId = async () => {
  const user = await ensureUserSession();
  return user?.id || 'anonymous';
};

export default supabase;
