import { SpriteSheetBmp } from './SpriteSheetBmp';

/**
 * 대표 캐릭터 (책사/장군)
 * 황건적이랑 같은 방식: BMP 한 장만 넣으면, 코드가 조각 내서 여러 장 넣은 것처럼 재생.
 * - 책사: public/character/strategist/atk.bmp (프레임 세로로 쌓기)
 * - 장군: public/character/general/x.bmp (프레임 세로로 쌓기)
 * 한 프레임 크기/배치 다르면 SLICE_SPEC 만 수정하면 됨.
 */
interface RepresentativeCharacterProps {
  variant?: 'strategist' | 'general';
  size?: number;
  className?: string;
}

/** 황건적이랑 동일: 한 프레임 크기, 세로 배치. 바꾸면 책사/장군 BMP 규격에 맞춤 */
const STRATEGIST_SLICE = {
  frameHeight: 64,
  frameCount: 12,
  layout: 'vertical' as const,
};

const GENERAL_SLICE = {
  frameHeight: 64,
  frameCount: 20,
  layout: 'vertical' as const,
};

/** 황건적이랑 같은 재생 속도 */
const FRAME_INTERVAL = 140;

export function RepresentativeCharacter({
  variant = 'strategist',
  size = 80,
  className = '',
}: RepresentativeCharacterProps) {
  const src =
    variant === 'strategist'
      ? '/character/strategist/atk.bmp'
      : '/character/general/x.bmp';
  const spec = variant === 'strategist' ? STRATEGIST_SLICE : GENERAL_SLICE;

  return (
    <SpriteSheetBmp
      src={src}
      frameHeight={spec.frameHeight}
      frameCount={spec.frameCount}
      layout={spec.layout}
      displaySize={size}
      frameInterval={FRAME_INTERVAL}
      alt={variant === 'strategist' ? '책사' : '장군'}
      className={className}
    />
  );
}
