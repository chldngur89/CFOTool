import { motion } from 'motion/react';
import { RUNWAY_DANGER_THRESHOLD, RUNWAY_WARNING_THRESHOLD } from '../../lib/finance';

/** 런웨이 구간: 3개월 이하 위험, 6개월 이하 주의, 그 이상 안전 → 25%, 50% */
const SAFE_PCT = (RUNWAY_WARNING_THRESHOLD / 12) * 100;   // 50%
const WARNING_PCT = (RUNWAY_DANGER_THRESHOLD / 12) * 100; // 25%

interface HPBarProps {
  percentage: number;
  label: string;
}

export function HPBar({ percentage, label }: HPBarProps) {
  const clamped = Math.max(0, Math.min(percentage, 100));

  const getColor = () => {
    if (clamped > SAFE_PCT) return 'from-emerald-400 to-emerald-600';
    if (clamped > WARNING_PCT) return 'from-amber-300 to-amber-500';
    return 'from-red-400 to-red-600';
  };

  const getText = () => {
    if (clamped > SAFE_PCT) return '안전';
    if (clamped > WARNING_PCT) return '주의';
    return '위험';
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="sg-label text-amber-100">{label}</span>
        <span className={`sg-label ${clamped > SAFE_PCT ? 'text-emerald-300' : clamped > WARNING_PCT ? 'text-amber-300' : 'text-red-300'}`}>
          {getText()}
        </span>
      </div>

      <div className="relative h-11 overflow-hidden rounded-md border-2 border-amber-700/70 bg-[#1b2a4a] shadow-[inset_0_0_0_1px_rgba(255,228,151,0.2)]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px)',
            backgroundSize: '14px 100%',
          }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${getColor()}`}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black tracking-[0.1em] text-amber-50 drop-shadow-[0_1px_0_rgba(0,0,0,0.7)]">
          {clamped.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
