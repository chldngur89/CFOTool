import { motion } from 'motion/react';
import { BanditCharacter } from '../character/BanditCharacter';
import { formatKoreanMoney } from '../../lib/finance';

interface PixelMonsterProps {
  type: 'personnel' | 'marketing' | 'office';
  cost: number;
  label: string;
  count?: number;
  onClick?: () => void;
}

export function PixelMonster({ type, cost, label, count, onClick }: PixelMonsterProps) {

  const getMonsterColor = () => {
    switch (type) {
      case 'personnel':
        return 'from-[#2f3f66] to-[#1f2d4b] border-amber-800/50';
      case 'marketing':
        return 'from-[#2f3f66] to-[#1f2d4b] border-amber-800/50';
      case 'office':
        return 'from-[#2f3f66] to-[#1f2d4b] border-amber-800/50';
    }
  };

  const banditsToShow = count ? Math.min(count, 5) : 3;
  const banditVariant =
    type === 'personnel'
      ? 'hogeoa'
      : type === 'marketing'
        ? 'extra_2'
        : 'extra_1';

  return (
    <motion.button
      type="button"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={!onClick}
      className={`bg-gradient-to-b ${getMonsterColor()} border-2 rounded-2xl p-4 relative shadow-sm w-full text-left appearance-none focus-visible:outline-none disabled:opacity-100 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* 도적군 헤더 - 전투 느낌 */}
      <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 rounded-md border border-red-900 bg-red-700 px-3 py-1 text-[10px] font-black text-red-100 whitespace-nowrap shadow-sm">
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
            <BanditCharacter variant={banditVariant} size={52} />
          </motion.div>
        ))}
      </div>
      
      {/* 정보 */}
      <div className="text-center">
        <div className="mb-2 text-sm font-bold text-amber-100">{label}</div>
        <div className="text-xl font-black text-amber-300">
          {formatKoreanMoney(cost)}
        </div>
        {count && (
          <div className="mt-1 text-xs text-slate-300">
            병력: {count}명
          </div>
        )}
      </div>

      {onClick && (
        <div className="mt-2 text-center text-[10px] font-bold text-amber-200/90">
          클릭하여 금액 수정
        </div>
      )}
    </motion.button>
  );
}
