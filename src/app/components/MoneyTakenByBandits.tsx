import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { formatKoreanMoney } from '../lib/finance';

const COIN_COUNT = 8;
const DURATION = 2.2;
const REPEAT_DELAY_MS = 6000;

interface MoneyTakenByBanditsProps {
  /** 월 지출 금액 (표시용, 애니메이션만 해도 됨) */
  monthlyBurn?: number;
  /** 한 번만 재생할지 여부 */
  runOnce?: boolean;
  className?: string;
}

/**
 * 월 지출 = 도적군이 금고에서 돈을 가져가는 모션
 * 금화가 성(왼쪽) 쪽에서 도적군(오른쪽) 쪽으로 날아감
 */
const FIRST_RUN_DELAY_MS = 1500;

export function MoneyTakenByBandits({
  monthlyBurn = 0,
  runOnce = false,
  className = '',
}: MoneyTakenByBanditsProps) {
  const [key, setKey] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const first = setTimeout(() => setVisible(true), FIRST_RUN_DELAY_MS);
    return () => clearTimeout(first);
  }, []);

  useEffect(() => {
    if (runOnce) return;
    const t = setInterval(() => {
      setVisible(false);
      setKey((k) => k + 1);
      const show = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(show);
    }, REPEAT_DELAY_MS);
    return () => clearInterval(t);
  }, [runOnce]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0">
        {/* 출발: 성 쪽(왼쪽) → 도착: 도적 카드 쪽(오른쪽) */}
        {visible &&
          Array.from({ length: COIN_COUNT }).map((_, i) => (
            <motion.div
              key={`${key}-${i}`}
              className="absolute opacity-90 drop-shadow-md"
              style={{
                top: `${38 + (i % 3) * 14}%`,
              }}
              initial={{ left: '5%', opacity: 0 }}
              animate={{
                left: '88%',
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: DURATION,
                delay: i * 0.12,
                opacity: { times: [0, 0.08, 0.88, 1], duration: DURATION },
              }}
            >
              <div className="relative h-4 w-4 rounded-sm border border-amber-200/90 bg-gradient-to-br from-amber-200 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                <div className="absolute inset-1 rounded-[2px] bg-amber-100/70" />
              </div>
            </motion.div>
          ))}
      </div>
      {/* "월 지출" 라벨 (선택) */}
      {monthlyBurn > 0 && (
        <motion.div
          className="absolute left-1/2 top-[72%] -translate-x-1/2 rounded-md border border-amber-700/70 bg-[#16233e]/90 px-3 py-1.5 text-xs font-bold text-amber-200 shadow-[inset_0_0_0_1px_rgba(255,223,138,0.2)]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          이번 달 운영비 흐름: {formatKoreanMoney(monthlyBurn)}
        </motion.div>
      )}
    </div>
  );
}
