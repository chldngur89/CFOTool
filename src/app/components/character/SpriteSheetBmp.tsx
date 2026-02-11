import { useState, useEffect } from 'react';

/** 마젠타 → 투명 */
const isMagenta = (r: number, g: number, b: number) =>
  r > 200 && g < 50 && b > 200;

/**
 * BMP 한 장을 "조각조각" 잘라서 제자리에서 모션만 바뀌게 표시.
 * - 스프라이트 시트: **프레임마다 캐릭터 전체가 한 포즈**로 들어가 있어야 함.
 *   한 장 긴 이미지(캐릭터를 위아래로 길게 그린 것)를 넣으면 80px씩 잘리면서 위로 흐르는 것처럼 보임.
 * - 올바른 예: 60×80 포즈1, 그 아래 60×80 포즈2, 그 아래 포즈3… 이렇게 세로로 쌓은 한 장.
 */
export interface SpriteSheetSliceSpec {
  /** 한 프레임 가로(px). 없으면 자동 추정 */
  frameWidth?: number;
  /** 한 프레임 세로(px). 없으면 자동 추정 */
  frameHeight?: number;
  /** 'vertical' = 프레임이 세로로 쌓임(조조전 스타일), 'horizontal' = 가로로 나열 */
  layout: 'vertical' | 'horizontal';
  /** 총 프레임 수(선택). 지정하면 frameWidth/frameHeight 일부를 자동 계산 */
  frameCount?: number;
}

interface SpriteSheetBmpProps extends SpriteSheetSliceSpec {
  /** 스프라이트 시트 BMP URL (한 장) */
  src: string;
  /** 화면에 보여줄 크기(px) */
  displaySize: number;
  /** 프레임 전환 간격(ms) */
  frameInterval?: number;
  alt?: string;
  className?: string;
  /** 조조전 스타일처럼 캐릭터 하단(발)을 고정해 프레임 흔들림을 줄임 */
  stabilizeBottom?: boolean;
}

interface FrameBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function hasVisiblePixel(data: Uint8ClampedArray, alphaIndex: number) {
  return data[alphaIndex] > 0;
}

function findVisibleBounds(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): FrameBox | null {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alphaIndex = (y * w + x) * 4 + 3;
      if (!hasVisiblePixel(data, alphaIndex)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function splitContinuousSegments(flags: boolean[]) {
  const segments: Array<{ start: number; end: number }> = [];
  let start = -1;
  for (let i = 0; i <= flags.length; i++) {
    const on = i < flags.length ? flags[i] : false;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      segments.push({ start, end: i });
      start = -1;
    }
  }

  // 프레임 내부에 1~2px 빈 줄이 섞여 있을 수 있어, 너무 짧은 간격은 같은 프레임으로 합침.
  const merged: Array<{ start: number; end: number }> = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (!prev) {
      merged.push(seg);
      continue;
    }
    const gap = seg.start - prev.end;
    if (gap <= 2) {
      prev.end = seg.end;
    } else {
      merged.push(seg);
    }
  }
  return merged;
}

function detectAutoSegments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layout: 'vertical' | 'horizontal'
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (layout === 'vertical') {
    const rows = new Array<boolean>(height).fill(false);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alphaIndex = (y * width + x) * 4 + 3;
        if (hasVisiblePixel(data, alphaIndex)) {
          rows[y] = true;
          break;
        }
      }
    }
    return splitContinuousSegments(rows).map(({ start, end }) => ({
      sx: 0,
      sy: start,
      sw: width,
      sh: end - start,
    }));
  }

  const cols = new Array<boolean>(width).fill(false);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const alphaIndex = (y * width + x) * 4 + 3;
      if (hasVisiblePixel(data, alphaIndex)) {
        cols[x] = true;
        break;
      }
    }
  }
  return splitContinuousSegments(cols).map(({ start, end }) => ({
    sx: start,
    sy: 0,
    sw: end - start,
    sh: height,
  }));
}

function makeTransparent(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (isMagenta(data[i], data[i + 1], data[i + 2])) data[i + 3] = 0;
  }
  ctx.putImageData(imageData, 0, 0);
}

export function SpriteSheetBmp({
  src,
  frameWidth,
  frameHeight,
  layout,
  frameCount,
  displaySize,
  frameInterval = 120,
  alt = '',
  className = '',
  stabilizeBottom = true,
}: SpriteSheetBmpProps) {
  const [frameDataUrls, setFrameDataUrls] = useState<string[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFrameDataUrls([]);

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const sheetW = img.naturalWidth;
      const sheetH = img.naturalHeight;
      if (!sheetW || !sheetH) return;

      const isVertical = layout === 'vertical';
      const widthHint =
        typeof frameWidth === 'number' && frameWidth > 0
          ? Math.floor(frameWidth)
          : undefined;
      const heightHint =
        typeof frameHeight === 'number' && frameHeight > 0
          ? Math.floor(frameHeight)
          : undefined;
      const countHint =
        typeof frameCount === 'number' && frameCount > 0
          ? Math.floor(frameCount)
          : undefined;

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = sheetW;
      fullCanvas.height = sheetH;
      const fullCtx = fullCanvas.getContext('2d');
      if (!fullCtx) return;

      fullCtx.drawImage(img, 0, 0);
      makeTransparent(fullCtx, sheetW, sheetH);

      const hasManualSlice =
        countHint != null || widthHint != null || heightHint != null;

      let slices: Array<{ sx: number; sy: number; sw: number; sh: number }> = [];

      if (hasManualSlice) {
        let resolvedFrameWidth = widthHint;
        let resolvedFrameHeight = heightHint;
        let resolvedFrameCount = countHint;

        if (isVertical) {
          resolvedFrameWidth ??= sheetW;
          if (!resolvedFrameHeight && resolvedFrameCount) {
            resolvedFrameHeight = Math.floor(sheetH / resolvedFrameCount);
          }
          resolvedFrameHeight ??= sheetH;
          if (!resolvedFrameCount) {
            resolvedFrameCount = Math.floor(sheetH / resolvedFrameHeight);
          }
        } else {
          resolvedFrameHeight ??= sheetH;
          if (!resolvedFrameWidth && resolvedFrameCount) {
            resolvedFrameWidth = Math.floor(sheetW / resolvedFrameCount);
          }
          resolvedFrameWidth ??= sheetW;
          if (!resolvedFrameCount) {
            resolvedFrameCount = Math.floor(sheetW / resolvedFrameWidth);
          }
        }

        if (
          !resolvedFrameWidth ||
          !resolvedFrameHeight ||
          !resolvedFrameCount ||
          resolvedFrameWidth <= 0 ||
          resolvedFrameHeight <= 0 ||
          resolvedFrameCount <= 0
        ) {
          setFrameDataUrls([]);
          return;
        }

        resolvedFrameWidth = Math.min(resolvedFrameWidth, sheetW);
        resolvedFrameHeight = Math.min(resolvedFrameHeight, sheetH);
        const maxFramesBySheet = isVertical
          ? Math.floor(sheetH / resolvedFrameHeight)
          : Math.floor(sheetW / resolvedFrameWidth);
        resolvedFrameCount = Math.max(
          1,
          Math.min(resolvedFrameCount, maxFramesBySheet)
        );

        for (let i = 0; i < resolvedFrameCount; i++) {
          const sx = isVertical ? 0 : i * resolvedFrameWidth;
          const sy = isVertical ? i * resolvedFrameHeight : 0;
          slices.push({
            sx,
            sy,
            sw: resolvedFrameWidth,
            sh: resolvedFrameHeight,
          });
        }
      } else {
        slices = detectAutoSegments(fullCtx, sheetW, sheetH, layout);
      }

      if (slices.length === 0) {
        setFrameDataUrls([]);
        return;
      }

      const rawFrames: HTMLCanvasElement[] = [];
      const boundsPerFrame: Array<FrameBox | null> = [];
      let maxBoundW = 1;
      let maxBoundH = 1;

      for (const { sx, sy, sw, sh } of slices) {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = sw;
        frameCanvas.height = sh;
        const frameCtx = frameCanvas.getContext('2d');
        if (!frameCtx) continue;

        frameCtx.clearRect(0, 0, sw, sh);
        frameCtx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

        const bounds = findVisibleBounds(frameCtx, sw, sh);
        if (!bounds) continue;
        boundsPerFrame.push(bounds);
        rawFrames.push(frameCanvas);

        if (bounds.width > maxBoundW) maxBoundW = bounds.width;
        if (bounds.height > maxBoundH) maxBoundH = bounds.height;
      }

      const results: string[] = [];

      rawFrames.forEach((rawFrame, index) => {
        const bounds = boundsPerFrame[index];
        const outCanvas = document.createElement('canvas');

        if (stabilizeBottom && bounds) {
          outCanvas.width = maxBoundW;
          outCanvas.height = maxBoundH;
          const outCtx = outCanvas.getContext('2d');
          if (!outCtx) {
            results.push('');
            return;
          }
          const dx = Math.floor((maxBoundW - bounds.width) / 2);
          const dy = maxBoundH - bounds.height;
          outCtx.drawImage(
            rawFrame,
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            dx,
            dy,
            bounds.width,
            bounds.height
          );
        } else {
          outCanvas.width = rawFrame.width;
          outCanvas.height = rawFrame.height;
          const outCtx = outCanvas.getContext('2d');
          if (!outCtx) {
            results.push('');
            return;
          }
          outCtx.drawImage(rawFrame, 0, 0);
        }

        try {
          results.push(outCanvas.toDataURL('image/png'));
        } catch {
          results.push('');
        }
      });

      if (results.length === 0) {
        setFrameDataUrls([]);
        return;
      }
      setFrameDataUrls(results);
    };
    img.onerror = () => setFrameDataUrls([]);
    img.src = src;

    return () => { cancelled = true; };
  }, [src, frameWidth, frameHeight, layout, frameCount, stabilizeBottom]);

  useEffect(() => {
    const valid = frameDataUrls.filter(Boolean);
    if (valid.length < 2) return;
    const id = setInterval(() => {
      setFrameIndex((j) => (j + 1) % valid.length);
    }, frameInterval);
    return () => clearInterval(id);
  }, [frameDataUrls, frameInterval]);

  const valid = frameDataUrls.filter(Boolean);
  const currentUrl = valid[frameIndex % Math.max(1, valid.length)];

  if (!currentUrl) {
    return (
      <div
        className={className}
        style={{
          width: displaySize,
          height: displaySize,
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

  // 제자리에서만 프레임만 바뀌게: 고정 크기 + overflow 숨김. 캐릭터는 항상 같은 위치(아래 기준).
  return (
    <div
      className={className}
      style={{
        width: displaySize,
        height: displaySize,
        minWidth: displaySize,
        minHeight: displaySize,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <img
        src={currentUrl}
        alt={alt}
        width={displaySize}
        height={displaySize}
        style={{
          display: 'block',
          width: displaySize,
          height: displaySize,
          minWidth: displaySize,
          minHeight: displaySize,
          objectFit: 'contain',
          objectPosition: 'bottom center',
          imageRendering: 'pixelated',
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
    </div>
  );
}
