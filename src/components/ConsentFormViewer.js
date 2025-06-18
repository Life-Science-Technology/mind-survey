import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import '../styles/ConsentFormViewer.css';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const ConsentFormViewer = ({ isOpen, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(0.8);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    console.log('PDF 로딩 성공:', numPages, '페이지');
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF 로딩 오류:', error);
    setError('PDF 파일을 불러올 수 없습니다. 네트워크 연결을 확인해주세요.');
    setLoading(false);
  };

  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.1, 0.5));

  if (!isOpen) return null;

  return (
    <div className="consent-viewer-overlay">
      <div className="consent-viewer-modal">
        <div className="consent-viewer-header">
          <h3>피험자동의서</h3>
          <div className="viewer-controls">
            <button onClick={zoomOut} disabled={scale <= 0.5} title="축소">
              축소
            </button>
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} disabled={scale >= 2.0} title="확대">
              확대
            </button>
            <button onClick={onClose} className="close-btn" title="닫기">
              ✕
            </button>
          </div>
        </div>

        <div className="consent-viewer-content">
          {loading && (
            <div className="loading-message">
              <p>PDF 파일을 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={onClose} className="btn">
                닫기
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="pdf-container">
              <Document
                file={`${process.env.PUBLIC_URL || ''}/피험자동의서.pdf`}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div>PDF 로딩 중...</div>}
                options={{
                  cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjs.version + '/cmaps/',
                  cMapPacked: true,
                }}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    scale={scale}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    className="pdf-page"
                  />
                ))}
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsentFormViewer; 