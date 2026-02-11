import { motion } from 'motion/react';

interface CastleProps {
  hp: number;
}

export function Castle({ hp }: CastleProps) {
  const getCastleColor = () => {
    if (hp > 66) return 'from-stone-600 to-stone-700';
    if (hp > 33) return 'from-amber-700 to-amber-800';
    return 'from-red-800 to-red-900';
  };

  return (
    <motion.div
      className="relative"
      animate={hp < 33 ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.5, repeat: hp < 33 ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* 성 구조 */}
      <div className="flex flex-col items-center">
        {/* 성벽 상단 */}
        <div className="flex gap-2 mb-2">
          <div className={`w-12 h-16 bg-gradient-to-b ${getCastleColor()} border-4 border-stone-900`}></div>
          <div className={`w-12 h-20 bg-gradient-to-b ${getCastleColor()} border-4 border-stone-900 relative`}>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-2xl">🚩</div>
          </div>
          <div className={`w-12 h-16 bg-gradient-to-b ${getCastleColor()} border-4 border-stone-900`}></div>
        </div>
        
        {/* 메인 성문 */}
        <div className={`w-40 h-32 bg-gradient-to-b ${getCastleColor()} border-4 border-stone-900 relative`}>
          {/* 성문 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-amber-900 border-4 border-stone-900">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-600 rounded-full"></div>
          </div>
          
          {/* 창문 */}
          <div className="absolute top-4 left-4 w-4 h-4 bg-yellow-600 border-2 border-stone-900"></div>
          <div className="absolute top-4 right-4 w-4 h-4 bg-yellow-600 border-2 border-stone-900"></div>
        </div>
        
        {/* 기단 */}
        <div className="w-48 h-4 bg-stone-800 border-4 border-stone-900"></div>
      </div>
      
      {/* HP 경고 이펙트 */}
      {hp < 33 && (
        <motion.div
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-red-500 font-bold text-xl"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ⚠️
        </motion.div>
      )}
    </motion.div>
  );
}
