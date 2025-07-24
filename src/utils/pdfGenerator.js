import { PDFDocument } from 'pdf-lib';
import supabase from '../supabaseClient';

// 한글 텍스트를 이미지로 변환하는 함수 (줄바꿈 지원)
const createTextImage = (text, fontSize = 12, maxWidth = 200, isAddress = false) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 해상도를 줄이고 실제 폰트 크기 사용
    const scaleFactor = 2;
    const actualFontSize = fontSize;
    
    // 폰트 설정
    ctx.font = `${actualFontSize}px "Malgun Gothic", "맑은 고딕", Arial, sans-serif`;
    ctx.fillStyle = 'black';
    
    // 텍스트를 줄바꿈하여 배열로 분할
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // 최대 2줄까지만 허용
    const finalLines = lines.slice(0, 2);
    if (lines.length > 2) {
      // 2줄을 넘으면 마지막 글자를 ...로 대체
      finalLines[1] = finalLines[1].slice(0, -3) + '...';
    }
    
    // 전체 텍스트 크기 계산 (자간 고려)
    const lineHeight = isAddress ? actualFontSize * 2.5 : actualFontSize * 1.4; // 주소일 때 줄간격 훨씬 더 넓게
    const letterSpacing = 0.5;
    
    // 자간을 고려한 실제 너비 계산
    const calculateLineWidth = (line) => {
      let width = 0;
      for (let i = 0; i < line.length; i++) {
        width += ctx.measureText(line[i]).width;
        if (i < line.length - 1) width += letterSpacing;
      }
      return width;
    };
    
    const totalWidth = Math.max(...finalLines.map(line => calculateLineWidth(line)));
    const totalHeight = finalLines.length * lineHeight;
    
    // 캔버스 크기 설정
    canvas.width = (totalWidth + 10) * scaleFactor;
    canvas.height = (totalHeight + 4) * scaleFactor;
    
    // 스케일링
    ctx.scale(scaleFactor, scaleFactor);
    
    // 배경을 투명하게 설정
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 텍스트 렌더링 설정
    ctx.font = `${actualFontSize}px "Malgun Gothic", "맑은 고딕", Arial, sans-serif`;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    // 렌더링 품질 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    
    // 각 줄을 그리기 (자간 조정)
    finalLines.forEach((line, index) => {
      // 자간을 넓히기 위해 글자별로 따로 그리기
      let xOffset = 5 / scaleFactor;
      const letterSpacing = 0.5; // 자간 조정값
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        ctx.fillText(char, xOffset, (2 + index * lineHeight) / scaleFactor);
        xOffset += ctx.measureText(char).width + letterSpacing;
      }
    });
    
    // 이미지 데이터 반환
    canvas.toBlob(resolve, 'image/png');
  });
};

export const generateConsentPDF = async (participant) => {
  try {
    // 1. 원본 PDF 파일 로드
    const pdfUrl = `${process.env.PUBLIC_URL}/피험자동의서.pdf`;
    const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    
    // 2. PDF 문서 로드
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1]; // 마지막 페이지
    
    // 3. 참여자 정보에서 데이터 추출
    const name = participant.name || '';
    const rawPhone = participant.phone || '';
    const address = participant.address || '';
    const consentDate = participant.consent_date || new Date().toISOString().split('T')[0];
    
    // 전화번호 포맷팅 함수 (010-1111-1111 형식)
    const formatPhoneNumber = (phoneNumber) => {
      if (!phoneNumber) return '';
      
      // 숫자만 추출
      const numbers = phoneNumber.replace(/\D/g, '');
      
      // 11자리 휴대폰 번호인 경우 포맷팅
      if (numbers.length === 11 && numbers.startsWith('010')) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
      }
      
      // 10자리 일반 전화번호인 경우 (예: 02-1234-5678)
      if (numbers.length === 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      }
      
      // 그 외의 경우 원본 반환
      return phoneNumber;
    };
    
    const phone = formatPhoneNumber(rawPhone);
    
    // 4. 양식의 정확한 위치에 정보 추가 (이미지 기준으로 좌표 설정)
    const fontSize = 6; // 글자 크기 훨씬 더 줄임
    const { height } = lastPage.getSize();
    
    // 양식 기준 좌표 (PDF 좌표계: 왼쪽 하단이 0,0) - 이미지 기준으로 정확히 조정
    const formPositions = {
      address: { x: 305, y: height - 295, maxWidth: 120 },      // 주소 / 위치 ("주소 /" 라벨 아래로 정확히 이동)
      phone: { x: 315, y: height - 348, maxWidth: 100 },        // 연락처 / 위치  
      name: { x: 305, y: height - 367, maxWidth: 80 },          // 성명 / 위치
      consentDate: { x: 325, y: height - 385, maxWidth: 80 }    // 동의일자 / 위치
    };
    
    // 각 필드별로 정보 삽입 (줄바꿈 지원)
    const fieldData = [
      { text: address, position: formPositions.address, maxWidth: formPositions.address.maxWidth, isAddress: true },
      { text: phone, position: formPositions.phone, maxWidth: formPositions.phone.maxWidth, isAddress: false },
      { text: name, position: formPositions.name, maxWidth: formPositions.name.maxWidth, isAddress: false },
      { text: consentDate, position: formPositions.consentDate, maxWidth: formPositions.consentDate.maxWidth, isAddress: false }
    ];
    
    // 5. 서명 이미지 처리 먼저 (배경에 위치하도록)
    const signaturePosition = { x: 470, y: height - 340 }; // 성명과 같은 높이, 서명 위치 정확히 조정
    
    try {
      const signatureImage = await getParticipantSignatureImage(participant.id);
      if (signatureImage) {
        const signatureImageBytes = await signatureImage.arrayBuffer();
        let embeddedImage;
        
        // 이미지 타입에 따라 임베드
        if (signatureImage.type.includes('png')) {
          embeddedImage = await pdfDoc.embedPng(signatureImageBytes);
        } else if (signatureImage.type.includes('jpg') || signatureImage.type.includes('jpeg')) {
          embeddedImage = await pdfDoc.embedJpg(signatureImageBytes);
        }
        
        if (embeddedImage) {
          // 서명 이미지 크기 조정 (비율 유지하며 크기 더 확대)
          const maxWidth = 100;  // 80에서 100으로 더 증가
          const maxHeight = 40;  // 30에서 40으로 더 증가
          
          // 비율을 유지하면서 최대 크기에 맞춤
          const scaleX = maxWidth / embeddedImage.width;
          const scaleY = maxHeight / embeddedImage.height;
          const scale = Math.min(scaleX, scaleY, 1.0); // 최대 원본 크기까지 허용
          
          const imageDims = embeddedImage.scale(scale);
          
          lastPage.drawImage(embeddedImage, {
            x: signaturePosition.x,
            y: signaturePosition.y - imageDims.height + 5, // 약간 위로 조정
            width: imageDims.width,
            height: imageDims.height,
          });
        }
      }
      // 서명이 없어도 별도 텍스트 표시하지 않음 (양식에 이미 "(서명 또는 인)" 표시됨)
    } catch (signatureError) {
      console.warn('서명 이미지 처리 중 오류:', signatureError);
      // 서명 처리 실패해도 PDF 생성은 계속 진행 (별도 오류 표시 안함)
    }

    // 6. 텍스트 이미지 처리 (서명 위에 표시되도록)
    for (const field of fieldData) {
      if (field.text) {
        try {
          const textImage = await createTextImage(field.text, fontSize, field.maxWidth, field.isAddress);
          if (textImage) {
            const textImageBytes = await textImage.arrayBuffer();
            const embeddedTextImage = await pdfDoc.embedPng(textImageBytes);
            
            // 텍스트 이미지의 높이를 고려하여 y 위치 조정
            const adjustedY = field.isAddress ? 
              field.position.y - embeddedTextImage.height + fontSize : // 주소: 텍스트 하단 기준
              field.position.y; // 다른 필드: 기존 방식
            
            lastPage.drawImage(embeddedTextImage, {
              x: field.position.x,
              y: adjustedY,
              width: embeddedTextImage.width,
              height: embeddedTextImage.height,
            });
          }
        } catch (textError) {
          console.warn(`텍스트 이미지 생성 실패: ${field.text}`, textError);
        }
      }
    }
    
    // 7. PDF 바이트 생성
    const pdfBytes = await pdfDoc.save();
    
    // 8. 파일 다운로드
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `피험자동의서_${name}_${consentDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('PDF 생성 중 오류:', error);
    throw new Error(`PDF 생성 실패: ${error.message}`);
  }
};

// 참여자의 서명 이미지를 가져오는 함수
const getParticipantSignatureImage = async (participantId) => {
  try {
    // 관리자 토큰 가져오기
    const adminToken = sessionStorage.getItem('adminToken');
    if (!adminToken) {
      throw new Error('Admin token not found');
    }
    
    // 참여자의 서명 이미지 파일 조회
    const { data: files, error } = await supabase
      .rpc('get_participant_files_for_admin', { 
        admin_token: adminToken, 
        participant_id_param: participantId 
      });
      
    if (error) {
      throw error;
    }
    
    // 서명 이미지 파일 찾기
    const signatureFile = files?.find(file => file.file_type === 'signature_image');
    
    if (!signatureFile) {
      return null;
    }
    
    // 스토리지에서 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('participant-files')
      .download(signatureFile.file_path);
      
    if (downloadError) {
      throw downloadError;
    }
    
    return fileData;
  } catch (error) {
    console.warn('서명 이미지 로드 실패:', error);
    return null;
  }
};