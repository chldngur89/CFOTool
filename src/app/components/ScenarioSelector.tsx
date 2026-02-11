import { motion } from 'motion/react';
import { PixelButton } from './pixel/PixelButton';

interface ScenarioSelectorProps {
  selectedScenario: 'defense' | 'maintain' | 'attack';
  onSelectScenario: (scenario: 'defense' | 'maintain' | 'attack') => void;
  onNext: () => void;
  onBack: () => void;
}

export function ScenarioSelector({
  selectedScenario,
  onSelectScenario,
  onNext,
  onBack
}: ScenarioSelectorProps) {
  const scenarios = [
    {
      id: 'defense' as const,
      icon: '🛡️',
      title: '방어 모드',
      description: '비용 -30% 절감',
      effect: '런웨이 +5개월',
      detail: '도적군 속도 느려짐',
      borderColor: 'border-primary',
      bgActive: 'bg-primary/5 border-primary',
    },
    {
      id: 'maintain' as const,
      icon: '⚔️',
      title: '현상 유지',
      description: '현행 코스 유지',
      effect: '런웨이 4.3개월',
      detail: '보통 속도 유지',
      borderColor: 'border-slate-200',
      bgActive: 'bg-slate-50 border-primary',
    },
    {
      id: 'attack' as const,
      icon: '⚡',
      title: '공격 모드',
      description: '마케팅 +50% 투자',
      effect: '런웨이 -1.2개월',
      detail: '금화 폭증, 도적군 증가',
      borderColor: 'border-slate-200',
      bgActive: 'bg-primary/5 border-primary',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5">
      {/* 헤더 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="inline-block">
          <h2 className="text-2xl font-bold text-navy-custom tracking-tight mb-2">
            다음 웨이브 대비 전략 선택
          </h2>
          <p className="text-slate-500 text-sm">
            어떤 전략으로 도적군의 공격을 막아낼 것인가?
          </p>
        </div>
      </motion.div>

      {/* 시나리오 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelectScenario(scenario.id)}
            className={`
              bg-white rounded-2xl p-6 cursor-pointer relative
              border-2 transition-all duration-200 shadow-sm
              ${selectedScenario === scenario.id ? scenario.bgActive : `border-slate-200 hover:border-primary/30`}
            `}
          >
            {selectedScenario === scenario.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
              >
                ✓
              </motion.div>
            )}

            <motion.div
              animate={selectedScenario === scenario.id ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="text-6xl text-center mb-4"
            >
              {scenario.icon}
            </motion.div>

            <h3 className="text-xl font-bold text-navy-custom text-center mb-3">
              {scenario.title}
            </h3>

            <div className="space-y-2 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-primary text-sm font-bold">{scenario.description}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-green-600 font-bold text-sm">{scenario.effect}</div>
              </div>
              <div className="text-slate-500 text-sm">
                {scenario.detail}
              </div>
            </div>

            <div className="flex justify-center mt-4 gap-2">
              {scenario.id === 'defense' && (
                <>
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>👥</motion.span>
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>👥</motion.span>
                </>
              )}
              {scenario.id === 'maintain' && (
                <>
                  <motion.span animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>👥</motion.span>
                  <motion.span animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>👥</motion.span>
                  <motion.span animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>👥</motion.span>
                </>
              )}
              {scenario.id === 'attack' && (
                <>
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 1, repeat: Infinity }}>💰</motion.span>
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}>💰</motion.span>
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>💰</motion.span>
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}>💰</motion.span>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-4"
      >
        <PixelButton onClick={onBack} variant="secondary">
          ← 돌아가기
        </PixelButton>
        <PixelButton onClick={onNext} variant="success" size="large">
          전략 세부 조정 →
        </PixelButton>
      </motion.div>
    </div>
  );
}
