import { useState, useEffect } from 'react';

/** 마젠타(핑크) 픽셀을 투명하게 만드는 기준 */
const isMagenta = (r: number, g: number, b: number) =>
  r > 200 && g < 50 && b > 200;

/**
 * BMP URL을 로드해서 마젠타 배경을 투명하게 바꾼 뒤 표시.
 * 여러 URL이면 순서대로 프레임 전환(애니메이션).
 */
interface BmpWithTransparencyProps {
  /** BMP URL 하나 또는 여러 개(애니메이션) */
  src: string | string[];
  /** 표시 크기(px) */
  size: number;
  /** 프레임 전환 간격(ms). 단일 이미지면 무시 */
  frameInterval?: number;
  alt?: string;
  className?: string;
}

function processImage(img: HTMLImageElement): string | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isMagenta(r, g, b)) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export function BmpWithTransparency({
  src,
  size,
  frameInterval = 150,
  alt = '',
  className = '',
}: BmpWithTransparencyProps) {
  const urls = Array.isArray(src) ? src : [src];
  const [dataUrls, setDataUrls] = useState<string[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDataUrls([]);

    urls.forEach((url, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const dataUrl = processImage(img);
        if (dataUrl) {
          setDataUrls((prev) => {
            const next = [...prev];
            next[i] = dataUrl;
            return next;
          });
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        setDataUrls((prev) => {
          const next = [...prev];
          next[i] = '';
          return next;
        });
      };
      img.src = url;
    });

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(urls)]);

  useEffect(() => {
    if (dataUrls.length < 2 || dataUrls.every((u) => !u)) return;
    const validUrls = dataUrls.filter(Boolean);
    if (validUrls.length < 2) return;
    const id = setInterval(() => {
      setFrameIndex((j) => (j + 1) % validUrls.length);
    }, frameInterval);
    return () => clearInterval(id);
  }, [dataUrls, frameInterval]);

  const valid = dataUrls.filter(Boolean);
  const currentUrl = valid.length > 0 ? valid[frameIndex % valid.length] : '';

  if (!currentUrl) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 4,
        }}
        aria-label={alt}
      >
        <span style={{ fontSize: 10, color: '#94a3b8' }}>...</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <img
        src={currentUrl}
        alt={alt}
        width={size}
        height={size}
        style={{
          display: 'block',
          width: size,
          height: size,
          objectFit: 'contain',
          objectPosition: 'bottom',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
