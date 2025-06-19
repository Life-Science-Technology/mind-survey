import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키를 가져옵니다
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// 디버깅: 환경 변수 상태 확인
console.log('🔍 환경 변수 확인:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  urlLength: supabaseUrl ? supabaseUrl.length : 0,
  keyLength: supabaseKey ? supabaseKey.length : 0,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
  key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'undefined'
});

// 환경 변수가 설정되지 않은 경우 모의(mock) 객체를 사용합니다
let supabase;

if (false) { // 항상 실제 Supabase 클라이언트 사용
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
      select: (columns = '*', options = {}) => {
        const mockQuery = {
          _conditions: {},
          _options: options,
          eq: (column, value) => {
            console.log(`${table} 테이블에서 ${columns} 조회 (${column} = ${value})`);
            
            // 조건 저장
            mockQuery._conditions[column] = value;
            
            return mockQuery;
          },
          single: async () => {
            console.log(`${table} 테이블에서 single 조회`);
            return {
              data: null,
              error: { message: 'No rows found' }
            };
          },
          or: (condition) => ({
            single: async () => {
              console.log(`${table} 테이블에서 OR 조건 single 조회: ${condition}`);
              return {
                data: null,
                error: { message: 'No rows found' }
              };
            }
          }),
          order: (column, options) => ({
            limit: (count) => {
              console.log(`${table} 테이블에서 정렬 및 제한 조회`);
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
            console.log(`${table} 테이블 조회 실행, 조건:`, mockQuery._conditions, '옵션:', mockQuery._options);
            
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
          console.log(`${table} 테이블 업데이트 (${column} = ${value}):`, data);
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
          console.log(`${bucket} 버킷에 파일 업로드 시뮬레이션: ${path}`);
          return {
            error: null,
            data: { path }
          };
        },
        download: async (path) => {
          console.log(`${bucket} 버킷에서 파일 다운로드 시뮬레이션: ${path}`);
          return {
            error: null,
            data: new Blob(['mock file content'], { type: 'application/octet-stream' })
          };
        }
      })
    },
    rpc: async (functionName, params) => {
      console.log(`RPC 함수 호출 시뮬레이션: ${functionName}`, params);
      return {
        error: { message: 'RPC function not available in mock mode' },
        data: null
      };
    },
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
  console.log('Supabase 클라이언트가 성공적으로 초기화되었습니다.');
}

// RLS를 위한 헬퍼 함수들
export const ensureUserSession = async () => {
  try {
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
