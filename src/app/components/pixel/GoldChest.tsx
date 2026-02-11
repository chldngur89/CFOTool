import { motion } from 'motion/react';

interface GoldChestProps {
  amount: number;
}

export function GoldChest({ amount }: GoldChestProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className="bg-gradient-to-b from-yellow-600 to-yellow-700 border-4 border-yellow-900 p-4 cursor-pointer"
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-5xl mb-2"
        >
          💰
        </motion.div>
        <div className="text-yellow-950 font-bold text-xs mb-1">월 매출</div>
        <div className="text-2xl font-bold text-yellow-950">
          ${(amount / 1000).toFixed(0)}K
        </div>
      </div>
      
      {/* 반짝임 효과 */}
      <motion.div
        className="absolute top-2 right-2 text-yellow-300"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        ✨
      </motion.div>
    </motion.div>
  );
}
