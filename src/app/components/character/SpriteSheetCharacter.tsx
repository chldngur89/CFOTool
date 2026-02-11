import { useState, useEffect, useRef, useId } from 'react';

/**
 * 조조전 스타일 스프라이트 시트 애니메이션.
 * BMP 한 장을 세로로 쌓인 프레임으로 보고, 한 프레임(한 명)만 보이게 한 뒤
 * steps()로 프레임을 바꿔서 움직이는 느낌을 냄.
 */
interface SpriteSheetCharacterProps {
  /** 스프라이트 시트 이미지 URL (세로로 프레임이 쌓인 한 장) */
  src: string;
  /** 한 프레임 가로 px (원본 시트 기준) */
  frameWidth?: number;
  /** 한 프레임 세로 px (원본 시트 기준) */
  frameHeight?: number;
  /** 프레임 수 (없으면 이미지 로드 후 세로/ frameHeight 로 계산) */
  frameCount?: number;
  /** 애니메이션 한 사이클 시간(ms) */
  duration?: number;
  /** 화면에 보여줄 크기 (한 프레임을 이 크기로 스케일) */
  displaySize?: number;
  alt?: string;
  className?: string;
}

export function SpriteSheetCharacter({
  src,
  frameWidth = 60,
  frameHeight = 80,
  frameCount: frameCountProp,
  duration = 800,
  displaySize,
  alt = '',
  className = '',
}: SpriteSheetCharacterProps) {
  const id = useId().replace(/:/g, '');
  const [frameCount, setFrameCount] = useState(frameCountProp ?? 1);
  const [ready, setReady] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (frameCountProp != null) {
      setFrameCount(frameCountProp);
      setReady(true);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const h = img.naturalHeight;
      const w = img.naturalWidth;
      if (h > 0 && frameHeight > 0) {
        setFrameCount(Math.max(1, Math.floor(h / frameHeight)));
      }
      setReady(true);
    };
    img.onerror = () => setReady(true);
    img.src = src;
  }, [src, frameHeight, frameCountProp]);

  const displayW = displaySize ?? frameWidth;
  const displayH = displaySize ?? frameHeight;
  const bgWidth = displaySize != null ? displayW : frameWidth;
  const bgHeight = displaySize != null ? frameCount * displayH : frameCount * frameHeight;
  const endY = displaySize != null ? -(frameCount - 1) * displayH : -(frameCount - 1) * frameHeight;

  return (
    <>
      <style>{`
        @keyframes sprite-sheet-${id} {
          from { background-position: 0 0; }
          to { background-position: 0 ${endY}px; }
        }
      `}</style>
      <img
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden
        className="absolute w-px h-px opacity-0 pointer-events-none"
      />
      <div
        className={className}
        style={{
          width: displayW,
          height: displayH,
          overflow: 'hidden',
          flexShrink: 0,
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 0',
          backgroundSize: `${bgWidth}px ${bgHeight}px`,
          imageRendering: 'pixelated',
          animation: ready && frameCount > 1
            ? `sprite-sheet-${id} ${duration}ms steps(${frameCount}) infinite`
            : undefined,
        }}
        role="img"
        aria-label={alt}
      />
    </>
  );
}
