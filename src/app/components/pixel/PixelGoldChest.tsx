import { motion } from 'motion/react';

interface PixelGoldChestProps {
  amount: number;
}

export function PixelGoldChest({ amount }: PixelGoldChestProps) {
  // 16x16 픽셀 보물상자
  const chestPixels = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,3,3,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
    [0,1,2,4,4,2,2,2,2,2,2,4,4,2,1,0],
    [0,1,2,4,4,2,2,5,5,2,2,4,4,2,1,0],
    [0,1,2,2,2,2,2,5,5,2,2,2,2,2,1,0],
    [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
    [0,1,2,2,2,6,6,6,6,6,6,2,2,2,1,0],
    [0,1,2,2,2,6,6,6,6,6,6,2,2,2,1,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ];

  // 금화들
  const coinPixels = [
    [0,0,1,1,1,1,0,0],
    [0,1,2,2,2,2,1,0],
    [1,2,2,3,3,2,2,1],
    [1,2,3,3,3,3,2,1],
    [1,2,3,3,3,3,2,1],
    [1,2,2,3,3,2,2,1],
    [0,1,2,2,2,2,1,0],
    [0,0,1,1,1,1,0,0],
  ];

  const getChestColor = (value: number) => {
    const colors: { [key: number]: string } = {
      0: 'transparent',
      1: '#3e2723', // 어두운 갈색 (윤곽선)
      2: '#8d6e63', // 갈색 (상자)
      3: '#ffd700', // 금색 (자물쇠)
      4: '#4e342e', // 진한 갈색 (장식)
      5: '#ffeb3b', // 밝은 노란색 (자물쇠 중앙)
      6: '#5d4037', // 상자 하단
    };
    return colors[value] || 'transparent';
  };

  const getCoinColor = (value: number) => {
    const colors: { [key: number]: string } = {
      0: 'transparent',
      1: '#b8860b', // 어두운 금색 (윤곽선)
      2: '#ffd700', // 금색
      3: '#ffed4e', // 밝은 금색 (하이라이트)
    };
    return colors[value] || 'transparent';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className="bg-gradient-to-b from-amber-800 to-amber-900 border-4 border-amber-950 p-4 cursor-pointer relative"
      style={{ imageRendering: 'pixelated' }}
    >
      <div className="text-center">
        {/* 보물상자 */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex justify-center mb-2"
        >
          <div className="grid" style={{ 
            gridTemplateColumns: 'repeat(16, 3px)',
            gap: 0,
          }}>
            {chestPixels.flat().map((pixel, index) => (
              <div
                key={index}
                style={{
                  width: '3px',
                  height: '3px',
                  backgroundColor: getChestColor(pixel),
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* 금화들 */}
        <div className="flex justify-center gap-1 mb-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              className="grid"
              style={{ 
                gridTemplateColumns: 'repeat(8, 2px)',
                gap: 0,
              }}
            >
              {coinPixels.flat().map((pixel, index) => (
                <div
                  key={index}
                  style={{
                    width: '2px',
                    height: '2px',
                    backgroundColor: getCoinColor(pixel),
                  }}
                />
              ))}
            </motion.div>
          ))}
        </div>

        <div className="text-yellow-950 font-bold text-xs mb-1">월 매출</div>
        <div className="text-2xl font-bold text-yellow-950">
          ${(amount / 1000).toFixed(0)}K
        </div>
      </div>
      
      {/* 반짝임 효과 */}
      <motion.div
        className="absolute top-2 right-2 text-yellow-300 text-lg"
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        ✨
      </motion.div>
    </motion.div>
  );
}
