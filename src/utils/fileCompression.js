// 허용되는 파일 타입 정의
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/vnd.ms-word', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.hancom.hwp'];

// 파일 타입 검증 함수
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

// 압축 대상 파일인지 확인 (이미지 파일만 압축)
export const shouldCompress = (file) => {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
};

// 파일 크기를 읽기 쉬운 형태로 변환
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 이미지 압축 함수
export const compressImage = (file, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 최대 크기 설정 (예: 1920px)
      const maxWidth = 1920;
      const maxHeight = 1920;
      
      let { width, height } = img;
      
      // 비율을 유지하면서 크기 조정
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지를 캔버스에 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // 압축된 이미지를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 원본 파일명과 압축된 파일을 조합하여 새 File 객체 생성
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('이미지 압축에 실패했습니다.'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };
    
    // 파일을 이미지로 로드
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };
    reader.readAsDataURL(file);
  });
}; 