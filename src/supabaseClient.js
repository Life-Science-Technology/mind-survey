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
      }
    })
  };
} else {
  // 실제 Supabase 클라이언트 생성
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase 클라이언트가 성공적으로 초기화되었습니다.');
}

export default supabase;
