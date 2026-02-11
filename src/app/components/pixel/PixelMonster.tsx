import { motion } from 'motion/react';
import { BanditCharacter } from '../character/BanditCharacter';

interface PixelMonsterProps {
  type: 'personnel' | 'marketing' | 'office';
  cost: number;
  label: string;
  count?: number;
}

export function PixelMonster({ type, cost, label, count }: PixelMonsterProps) {

  const getMonsterColor = () => {
    switch (type) {
      case 'personnel':
        return 'from-slate-700 to-slate-800 border-slate-600';
      case 'marketing':
        return 'from-slate-700 to-slate-800 border-slate-600';
      case 'office':
        return 'from-slate-700 to-slate-800 border-slate-600';
    }
  };

  const banditsToShow = count ? Math.min(count, 5) : 3;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`bg-gradient-to-b ${getMonsterColor()} border-2 rounded-2xl p-4 relative shadow-sm`}
    >
      {/* 도적군 헤더 - 전투 느낌 */}
      <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap shadow-sm">
        도적 부대
      </div>

      {/* 도적 캐릭터 이미지 (atk/mov/spc 모션) */}
      <div className="flex justify-center items-end gap-1 mb-3 mt-2 flex-wrap">
        {Array.from({ length: banditsToShow }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <BanditCharacter variant="default" size={52} />
          </motion.div>
        ))}
      </div>
      
      {/* 정보 */}
      <div className="text-center">
        <div className="text-slate-200 font-bold text-sm mb-2">{label}</div>
        <div className="text-xl font-bold text-primary">
          ${(cost / 1000).toFixed(1)}K
        </div>
        {count && (
          <div className="text-xs text-slate-400 mt-1">
            병력: {count}명
          </div>
        )}
      </div>

      {/* 공격 화살 효과 */}
      <motion.div
        className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-2xl text-primary"
        animate={{ x: [0, -10, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        ←
      </motion.div>
    </motion.div>
  );
}
