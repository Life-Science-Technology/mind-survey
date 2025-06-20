import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키를 가져옵니다
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// 환경 변수가 설정되지 않은 경우 모의(mock) 객체를 사용합니다
let supabase;

if (false) { // 항상 실제 Supabase 클라이언트 사용
  // 모의 Supabase 클라이언트 객체
  supabase = {
    from: (table) => ({
      insert: async (data) => {
        // 성공적인 응답 시뮬레이션 - 실제 Supabase 응답과 동일하게 설정
        return { 
          error: null,
          status: 201,
          statusText: 'Created'
        };  
      },
      select: (columns = '*', options = {}) => {
        const mockQuery = {
          _conditions: {},
          _options: options,
          eq: (column, value) => {
            // 조건 저장
            mockQuery._conditions[column] = value;
            
            return mockQuery;
          },
          single: async () => {
            return {
              data: null,
              error: { message: 'No rows found' }
            };
          },
          or: (condition) => ({
            single: async () => {
              return {
                data: null,
                error: { message: 'No rows found' }
              };
            }
          }),
          order: (column, options) => ({
            limit: (count) => {
              return {
                then: async (resolve) => {
                  return resolve({
                    data: [],
                    error: null
                  });
                }
              };
            }
          }),
          // 체이닝을 지원하는 then 메서드 추가
          then: async (resolve) => {
            // count 옵션이 있는 경우
            if (mockQuery._options.count === 'exact') {
              return resolve({
                count: 10, // 모의 카운트
                error: null
              });
            }
            
            // survey-person 테이블에서 특정 조건이 모두 일치하는 경우 모의 사용자 반환
            if (table === 'survey-person' && 
                mockQuery._conditions.name && 
                mockQuery._conditions.email && 
                mockQuery._conditions.phone) {
              
              // 테스트용: 특정 조건에서만 사용자 반환
              if (mockQuery._conditions.name === '테스트' &&
                  mockQuery._conditions.email === 'test@example.com' &&
                  mockQuery._conditions.phone === '01012345678') {
                
                return resolve({
                  data: [{
                    id: 'mock-user-1',
                    name: mockQuery._conditions.name,
                    email: mockQuery._conditions.email,
                    phone: mockQuery._conditions.phone,
                    registration_step: 1
                  }],
                  error: null
                });
              }
            }
            
            return resolve({
              data: [],
              error: null
            });
          }
        };
        return mockQuery;
      },
      update: (data) => ({
        eq: async (column, value) => {
          return {
            error: null,
            status: 200,
            statusText: 'OK'
          };
        }
      })
    }),
    storage: {
      from: (bucket) => ({
        upload: async (path, file) => {
          return {
            error: null,
            data: { path }
          };
        },
        download: async (path) => {
          return {
            error: null,
            data: new Blob(['mock file content'], { type: 'application/octet-stream' })
          };
        }
      })
    },
    rpc: async (functionName, params) => {
      return {
        error: { message: 'RPC function not available in mock mode' },
        data: null
      };
    },
    auth: {
      signInAnonymously: async () => {
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
}

// RLS를 위한 헬퍼 함수들
export const ensureUserSession = async () => {
  try {
    // 실제 Supabase 사용 시에는 세션 체크 없이 진행 
    // (RLS 정책이 데이터베이스 레벨에서 보안을 처리)
    return { id: 'anonymous-user' };
  } catch (error) {
    // 오류가 발생해도 계속 진행할 수 있도록 기본 사용자 반환
    return { id: 'fallback-user' };
  }
};

export const getCurrentUserId = async () => {
  const user = await ensureUserSession();
  return user?.id || 'anonymous';
};

export default supabase;
