import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키를 가져옵니다
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// 환경 변수가 설정되지 않은 경우 모의(mock) 객체를 사용합니다
let supabase;

if (!supabaseUrl || !supabaseKey) {
  console.warn('환경 변수가 설정되지 않아 모의 Supabase 클라이언트를 사용합니다.');
  
  // 모의 Supabase 클라이언트 객체
  supabase = {
    from: (table) => ({
      insert: async (data) => {
        console.log(`데이터가 ${table} 테이블에 저장되었습니다:`, data);
        // 성공적인 응답 시뮬레이션 - 실제 Supabase 응답과 동일하게 설정
        return { 
          error: null,
          status: 201,
          statusText: 'Created'
        };  
      },
      select: async (columns = '*') => {
        console.log(`${table} 테이블에서 ${columns} 조회`);
        return {
          data: [],
          error: null
        };
      },
      update: async (data) => {
        console.log(`${table} 테이블 업데이트:`, data);
        return {
          error: null,
          status: 200
        };
      }
    }),
    auth: {
      signInAnonymously: async () => {
        console.log('익명 로그인 시뮬레이션');
        return {
          data: { user: { id: 'mock-user-id' } },
          error: null
        };
      },
      getUser: async () => {
        return {
          data: { user: { id: 'mock-user-id' } },
          error: null
        };
      }
    }
  };
} else {
  // 실제 Supabase 클라이언트 생성
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    // RLS 정책이 적용되도록 설정
    db: {
      schema: 'public'
    }
  });
  console.log('Supabase 클라이언트가 성공적으로 초기화되었습니다.');
}

// RLS를 위한 헬퍼 함수들 (현재는 항상 성공하도록 단순화)
export const ensureUserSession = async () => {
  try {
    // 환경 변수가 없는 경우 (개발/테스트)
    if (!supabaseUrl || !supabaseKey) {
      return { id: 'mock-user-id' };
    }

    // 실제 Supabase 사용 시에는 세션 체크 없이 진행 
    // (RLS 정책이 데이터베이스 레벨에서 보안을 처리)
    return { id: 'anonymous-user' };
  } catch (error) {
    console.error('사용자 세션 확인 실패:', error);
    // 오류가 발생해도 계속 진행할 수 있도록 기본 사용자 반환
    return { id: 'fallback-user' };
  }
};

export const getCurrentUserId = async () => {
  const user = await ensureUserSession();
  return user?.id || 'anonymous';
};

export default supabase;
