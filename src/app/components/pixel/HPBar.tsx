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
  const getColor = () => {
    if (percentage > SAFE_PCT) return 'bg-green-500';
    if (percentage > WARNING_PCT) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getText = () => {
    if (percentage > SAFE_PCT) return '안전';
    if (percentage > WARNING_PCT) return '주의';
    return '위험';
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-300 font-bold text-sm">{label}</span>
        <span className={`text-sm font-bold ${percentage > 66 ? 'text-green-400' : percentage > 33 ? 'text-amber-400' : 'text-red-400'}`}>
          {getText()}
        </span>
      </div>

      <div className="relative h-10 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${getColor()} rounded-xl`}
        />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-md">
          {percentage.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
