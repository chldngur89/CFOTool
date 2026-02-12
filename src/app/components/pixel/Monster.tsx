import { motion } from 'motion/react';
import { formatKoreanMoney } from '../../lib/finance';

interface MonsterProps {
  type: 'personnel' | 'marketing' | 'office';
  cost: number;
  label: string;
  count?: number;
}

export function Monster({ type, cost, label, count }: MonsterProps) {
  const getMonsterEmoji = () => {
    switch (type) {
      case 'personnel':
        return '⚔️';
      case 'marketing':
        return '🏹';
      case 'office':
        return '🛡️';
    }
  };

  const getMonsterColor = () => {
    switch (type) {
      case 'personnel':
        return 'from-red-700 to-red-800';
      case 'marketing':
        return 'from-orange-700 to-orange-800';
      case 'office':
        return 'from-yellow-700 to-yellow-800';
    }
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1 }}
      className={`bg-gradient-to-b ${getMonsterColor()} border-4 border-stone-900 p-4 relative`}
    >
      {/* 황건적 헤더 */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-yellow-950 px-3 py-1 text-xs font-bold border-2 border-stone-900 whitespace-nowrap">
        황건적 부대
      </div>
      
      {/* 몬스터 비주얼 */}
      <div className="flex justify-center mb-3 mt-2">
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl"
        >
          {getMonsterEmoji()}
        </motion.div>
      </div>
      
      {/* 정보 */}
      <div className="text-center">
        <div className="text-yellow-200 font-bold mb-2">{label}</div>
        <div className="text-2xl font-bold text-red-300">
          {formatKoreanMoney(cost)}
        </div>
        {count && (
          <div className="text-xs text-yellow-300 mt-1">
            병력: {count}명
          </div>
        )}
      </div>
      
      {/* 공격 화살 효과 */}
      <motion.div
        className="absolute -right-2 top-1/2 transform -translate-y-1/2 text-2xl"
        animate={{ x: [0, -10, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        →
      </motion.div>
    </motion.div>
  );
}
