import { useState, useEffect, useRef } from 'react';

/**
 * BMP(또는 이미지)를 픽셀 단위로 잘라서,
 * 한 픽셀당 하나의 칸으로 그리드처럼 그립니다.
 * - 이미지 로드 → canvas에 그리기 → getImageData로 픽셀 추출 → div 그리드로 렌더
 */
interface PixelGridFromImageProps {
  src: string;
  /** 화면에서 한 픽셀(원본 1px)을 몇 px 크기로 그릴지 (픽셀 아트 스케일) */
  pixelSize?: number;
  /** 최대 표시 너비 (픽셀 그리드 전체가 이 안에 맞도록 pixelSize를 조정할 수 있음) */
  maxSize?: number;
  alt?: string;
  className?: string;
}

interface PixelData {
  width: number;
  height: number;
  colors: string[]; // 'rgba(r,g,b,a)' per pixel, row-major
}

export function PixelGridFromImage({
  src,
  pixelSize: pixelSizeProp = 4,
  maxSize,
  alt = '',
  className = '',
}: PixelGridFromImageProps) {
  const [pixelData, setPixelData] = useState<PixelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!src) return;

    setLoading(true);
    setError(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) {
        setError(true);
        setLoading(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError(true);
        setLoading(false);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const colors: string[] = [];
      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const a = data[i * 4 + 3];
        colors.push(`rgba(${r},${g},${b},${a / 255})`);
      }
      setPixelData({ width: w, height: h, colors });
      setLoading(false);
    };

    img.onerror = () => {
      setError(true);
      setLoading(false);
    };

    img.src = src;
  }, [src]);

  if (loading) {
    return (
      <div
        className={`inline-block bg-slate-700/50 animate-pulse rounded ${className}`}
        style={{ width: maxSize ?? 64, height: maxSize ?? 64 }}
        aria-label={alt}
      />
    );
  }

  if (error || !pixelData) {
    return (
      <div
        className={`inline-block bg-slate-600 rounded text-slate-400 text-xs flex items-center justify-center ${className}`}
        style={{ width: maxSize ?? 64, height: maxSize ?? 64 }}
        aria-label={alt}
      >
        ?
      </div>
    );
  }

  const { width, height, colors } = pixelData;
  let pixelSize = pixelSizeProp;
  if (maxSize && Math.max(width, height) * pixelSize > maxSize) {
    pixelSize = Math.max(1, Math.floor(maxSize / Math.max(width, height)));
  }

  return (
    <div
      className={`inline-block ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${height}, ${pixelSize}px)`,
        gap: 0,
        width: width * pixelSize,
        height: height * pixelSize,
      }}
      aria-label={alt}
    >
      {colors.map((color, i) => (
        <div
          key={i}
          style={{
            width: pixelSize,
            height: pixelSize,
            backgroundColor: color,
            minWidth: pixelSize,
            minHeight: pixelSize,
          }}
        />
      ))}
    </div>
  );
}
