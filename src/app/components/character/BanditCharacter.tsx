import { BmpWithTransparency } from './BmpWithTransparency';
import { SpriteSheetBmp } from './SpriteSheetBmp';

/**
 * 도적(황건적) 캐릭터
 * - rebel_staff: 조각 내서 준 이미지 2장 (PNG) → 마젠타 투명, 프레임 전환
 * - rebel_staff_sheet: BMP 한 장에 프레임 세로로 쌓은 것 → 같은 결과 (조각은 코드가 잘라씀)
 * - default: 기존 atk.bmp 스프라이트 시트
 */
interface BanditCharacterProps {
  variant?:
    | 'default'
    | 'rebel_staff'
    | 'rebel_staff_sheet'
    | 'extra_1'
    | 'extra_2'
    | 'hogeoa';
  size?: number;
  className?: string;
}

/** 조각 내서 준 봉 든 황건적 2프레임 */
const REBEL_STAFF_FRAMES = [
  '/character/bandit/rebel_staff_1.png',
  '/character/bandit/rebel_staff_2.png',
];

/** BMP 한 장으로 쓸 때: 프레임 크기만 맞추면 코드가 조각 내서 씀 */
const REBEL_STAFF_SHEET = {
  src: '/character/bandit/rebel_staff_sheet.bmp',
  layout: 'vertical' as const,
  frameCount: 2,
};

const EXTRA_BANDIT_1 = '/character/bandit/atk_extra_1.bmp';
const EXTRA_BANDIT_2 = '/character/bandit/atk_extra_2.bmp';
const HOGEOA_BANDIT_ATK = '/character/bandit/hogeoa_atk.bmp';

const DEFAULT_SLICE = {
  frameHeight: 64,
  frameCount: 12,
  layout: 'vertical' as const,
};

export function BanditCharacter({
  variant = 'rebel_staff',
  size = 56,
  className = '',
}: BanditCharacterProps) {
  if (variant === 'rebel_staff') {
    return (
      <BmpWithTransparency
        src={REBEL_STAFF_FRAMES}
        size={size}
        frameInterval={140}
        alt="황건적 (봉)"
        className={className}
      />
    );
  }

  if (variant === 'rebel_staff_sheet') {
    return (
      <SpriteSheetBmp
        src={REBEL_STAFF_SHEET.src}
        layout={REBEL_STAFF_SHEET.layout}
        frameCount={REBEL_STAFF_SHEET.frameCount}
        displaySize={size}
        frameInterval={140}
        alt="황건적 (봉)"
        className={className}
      />
    );
  }

  if (variant === 'extra_1' || variant === 'extra_2') {
    return (
      <SpriteSheetBmp
        src={variant === 'extra_1' ? EXTRA_BANDIT_1 : EXTRA_BANDIT_2}
        frameHeight={DEFAULT_SLICE.frameHeight}
        frameCount={DEFAULT_SLICE.frameCount}
        layout={DEFAULT_SLICE.layout}
        displaySize={size}
        frameInterval={120}
        alt={variant === 'extra_1' ? '황건적 A' : '황건적 B'}
        className={className}
      />
    );
  }

  if (variant === 'hogeoa') {
    return (
      <SpriteSheetBmp
        src={HOGEOA_BANDIT_ATK}
        frameHeight={DEFAULT_SLICE.frameHeight}
        frameCount={DEFAULT_SLICE.frameCount}
        layout={DEFAULT_SLICE.layout}
        displaySize={size}
        frameInterval={120}
        alt="호거아"
        className={className}
      />
    );
  }

  return (
    <SpriteSheetBmp
      src="/character/bandit/atk.bmp"
      frameHeight={DEFAULT_SLICE.frameHeight}
      frameCount={DEFAULT_SLICE.frameCount}
      layout={DEFAULT_SLICE.layout}
      displaySize={size}
      frameInterval={120}
      alt="도적"
      className={className}
    />
  );
}
